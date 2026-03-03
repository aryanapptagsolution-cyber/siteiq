import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { normalizeWeights, computeCompositeScore } from '@/utils/normalizeWeights';
import { DEFAULT_WEIGHTS, WeightConfig } from '@/types/scoring';

const REQUIRED_COLUMNS = ['address', 'city', 'state', 'metro', 'lat', 'lng'];
const FACTOR_COLUMNS: Record<string, string> = {
    ev_score: 'evScore',
    population: 'population',
    ev_ownership: 'evOwnership',
    ev_usage_demand: 'evUsageDemand',
    street_traffic: 'streetTraffic',
    income: 'income',
    proximity_amenities: 'proximityAmenities',
    foot_traffic: 'footTraffic',
    mall_occupancy: 'mallOccupancy',
    retailers: 'retailers',
};

function determineBucket(score: number): string {
    if (score >= 75) return 'immediate';
    if (score >= 55) return 'near-term';
    if (score >= 35) return 'long-term';
    return 'gated';
}

function parseNumeric(val: unknown): number {
    const n = Number(val);
    return isNaN(n) ? 0 : Math.max(0, Math.min(100, n));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRows(rawRows: any[]): { sites: any[]; errors: string[] } {
    const errors: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sites: any[] = [];

    // Normalise header names (lowercase, trim, replace spaces with underscores)
    const normalised = rawRows.map((row) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const out: Record<string, any> = {};
        for (const [key, val] of Object.entries(row)) {
            out[key.toLowerCase().trim().replace(/\s+/g, '_')] = val;
        }
        return out;
    });

    // Check required columns exist in first row
    if (normalised.length > 0) {
        const headers = Object.keys(normalised[0]);
        const missingRequired = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
        if (missingRequired.length > 0) {
            errors.push(`Missing required columns: ${missingRequired.join(', ')}`);
            return { sites: [], errors };
        }
    }

    const weights = normalizeWeights(DEFAULT_WEIGHTS);

    normalised.forEach((row, idx) => {
        const rowNum = idx + 2; // +2 for header + 0-index
        const rowErrors: string[] = [];

        if (!row.address) rowErrors.push('address is empty');
        if (!row.lat || isNaN(Number(row.lat))) rowErrors.push('lat is invalid');
        if (!row.lng || isNaN(Number(row.lng))) rowErrors.push('lng is invalid');

        if (rowErrors.length > 0) {
            errors.push(`Row ${rowNum}: ${rowErrors.join(', ')}`);
            return;
        }

        const factorScores: Record<string, number> = {};
        const missingFields: string[] = [];

        for (const [csvCol, tsKey] of Object.entries(FACTOR_COLUMNS)) {
            if (row[csvCol] !== undefined && row[csvCol] !== '' && row[csvCol] !== null) {
                factorScores[tsKey] = parseNumeric(row[csvCol]);
            } else {
                factorScores[tsKey] = 0;
                missingFields.push(csvCol);
            }
        }

        const compositeScore = computeCompositeScore(factorScores, weights);
        const bucket = determineBucket(compositeScore);

        const gradeRaw = String(row.data_quality_grade ?? '').toUpperCase();
        const dataQualityGrade = ['A', 'B', 'C'].includes(gradeRaw) ? gradeRaw : 'C';

        // Build utility info if columns exist
        let utilityInfo = null;
        if (row.utility_provider || row.grid_capacity_pct) {
            utilityInfo = {
                provider: row.utility_provider ?? '',
                gridCapacityPct: parseNumeric(row.grid_capacity_pct),
                interconnectionQueueMonths: Number(row.interconnection_queue_months) || 0,
                permitStatus: ['approved', 'pending', 'denied'].includes(row.permit_status) ? row.permit_status : 'pending',
                flagged: parseNumeric(row.grid_capacity_pct) > 80,
            };
        }

        // Owner info
        let ownerInfo = null;
        if (row.owner_name || row.owner_email) {
            ownerInfo = {
                name: row.owner_name ?? '',
                email: row.owner_email ?? '',
                phone: row.owner_phone ?? '',
                propertyType: row.property_type ?? '',
                parcelId: row.parcel_id ?? '',
                leaseStatus: ['available', 'restricted', 'unavailable'].includes(row.lease_status) ? row.lease_status : 'available',
            };
        }

        sites.push({
            site_id: row.site_id ?? `SITE-${String(idx + 1).padStart(4, '0')}`,
            address: row.address,
            city: row.city ?? '',
            state: row.state ?? '',
            metro: row.metro ?? '',
            lat: Number(row.lat),
            lng: Number(row.lng),
            composite_score: compositeScore,
            factor_scores: factorScores,
            bucket,
            data_quality_grade: dataQualityGrade,
            missing_fields: missingFields,
            utility_flag: utilityInfo?.flagged ?? false,
            utility_info: utilityInfo,
            owner_info: ownerInfo,
            notes: row.notes ?? '',
            score_timestamp: new Date().toISOString(),
        });
    });

    return { sites, errors };
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        const supabase = createServerSupabase(token);

        // Verify user is admin/planner
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role, name')
            .eq('id', user.id)
            .single();

        if (!profile || !['admin', 'planner'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden: admin or planner role required' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const fileName = file.name.toLowerCase();
        const buffer = Buffer.from(await file.arrayBuffer());
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let rawRows: any[] = [];

        if (fileName.endsWith('.csv')) {
            const text = buffer.toString('utf-8');
            const result = Papa.parse(text, { header: true, skipEmptyLines: true });
            rawRows = result.data;
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        } else {
            return NextResponse.json({ error: 'Unsupported file type. Use CSV, XLSX, or XLS.' }, { status: 400 });
        }

        if (rawRows.length === 0) {
            return NextResponse.json({ error: 'File is empty or has no data rows' }, { status: 400 });
        }

        const { sites, errors } = parseRows(rawRows);

        if (sites.length === 0) {
            return NextResponse.json({ error: 'No valid rows found', details: errors }, { status: 400 });
        }

        // Create upload record
        const { data: uploadRecord, error: uploadError } = await supabase
            .from('uploads')
            .insert({
                filename: file.name,
                file_type: fileName.endsWith('.csv') ? 'csv' : 'xlsx',
                records_count: sites.length,
                errors_count: errors.length,
                uploaded_by: user.id,
                status: 'completed',
            })
            .select('id')
            .single();

        if (uploadError) {
            return NextResponse.json({ error: 'Failed to create upload record', details: uploadError.message }, { status: 500 });
        }

        // Tag sites with upload_id
        const taggedSites = sites.map((s) => ({ ...s, upload_id: uploadRecord.id }));

        // Batch insert sites (Supabase supports bulk insert)
        const { error: insertError } = await supabase.from('sites').insert(taggedSites);

        if (insertError) {
            return NextResponse.json({ error: 'Failed to insert sites', details: insertError.message }, { status: 500 });
        }

        // Update ranks for the metro(s) affected
        const metros = [...new Set(sites.map((s) => s.metro))];
        for (const metro of metros) {
            try {
                await supabase.rpc('update_ranks_for_metro', { target_metro: metro });
            } catch {
                // If RPC doesn't exist yet, skip ranking
            }
        }

        // Audit log
        await supabase.from('audit_logs').insert({
            user_id: user.id,
            user_name: profile.name,
            user_role: profile.role,
            action: 'file_upload',
            details: `Uploaded ${file.name}: ${sites.length} sites inserted, ${errors.length} errors`,
            status: 'success',
        });

        return NextResponse.json({
            success: true,
            inserted: sites.length,
            errors,
            uploadId: uploadRecord.id,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
