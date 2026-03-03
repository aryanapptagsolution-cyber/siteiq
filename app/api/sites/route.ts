import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        const supabase = createServerSupabase(token);

        const { searchParams } = new URL(request.url);
        const metro = searchParams.get('metro');
        const page = Number(searchParams.get('page') ?? '1');
        const pageSize = Number(searchParams.get('pageSize') ?? '50');
        const sortBy = searchParams.get('sortBy') ?? 'composite_score';
        const sortDir = searchParams.get('sortDir') ?? 'desc';
        const buckets = searchParams.get('buckets');
        const qualityGrades = searchParams.get('qualityGrades');
        const search = searchParams.get('search');

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('sites')
            .select('*', { count: 'exact' });

        if (metro) {
            query = query.eq('metro', metro);
        }

        if (buckets) {
            const bucketList = buckets.split(',').filter(Boolean);
            if (bucketList.length > 0) {
                query = query.in('bucket', bucketList);
            }
        }

        if (qualityGrades) {
            const gradeList = qualityGrades.split(',').filter(Boolean);
            if (gradeList.length > 0) {
                query = query.in('data_quality_grade', gradeList);
            }
        }

        if (search) {
            query = query.or(`address.ilike.%${search}%,site_id.ilike.%${search}%,city.ilike.%${search}%`);
        }

        // Map camelCase sort columns to snake_case DB columns
        const sortColumnMap: Record<string, string> = {
            compositeScore: 'composite_score',
            composite_score: 'composite_score',
            siteId: 'site_id',
            address: 'address',
            bucket: 'bucket',
            dataQualityGrade: 'data_quality_grade',
            rank: 'rank',
        };

        const dbSortCol = sortColumnMap[sortBy] ?? 'composite_score';
        query = query.order(dbSortCol, { ascending: sortDir === 'asc' });
        query = query.range(from, to);

        const { data: sites, error, count } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform DB rows to frontend format
        const transformed = (sites ?? []).map((row, index) => ({
            id: row.id,
            siteId: row.site_id,
            address: row.address,
            city: row.city,
            state: row.state,
            metro: row.metro,
            lat: row.lat,
            lng: row.lng,
            compositeScore: row.composite_score,
            factorScores: row.factor_scores,
            bucket: row.bucket,
            dataQualityGrade: row.data_quality_grade,
            missingFields: row.missing_fields ?? [],
            utilityFlag: row.utility_flag,
            utilityInfo: row.utility_info,
            owner: row.owner_info,
            dataSources: row.data_sources ?? [],
            photos: row.photos ?? [],
            notes: row.notes ?? '',
            scoreTimestamp: row.score_timestamp,
            rank: row.rank ?? (from + index + 1),
        }));

        const total = count ?? 0;

        return NextResponse.json({
            sites: transformed,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
