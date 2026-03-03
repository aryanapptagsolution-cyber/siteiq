import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        const supabase = createServerSupabase(token);

        const { searchParams } = new URL(request.url);
        const metro = searchParams.get('metro');
        const limit = Number(searchParams.get('limit') ?? '50');

        let query = supabase
            .from('sites')
            .select('site_id, address, city, state, metro, lat, lng, composite_score, factor_scores, bucket, data_quality_grade, missing_fields, utility_flag, utility_info, owner_info, notes, score_timestamp, rank')
            .order('composite_score', { ascending: false })
            .limit(limit);

        if (metro) {
            query = query.eq('metro', metro);
        }

        const { data: sites, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Build CSV
        const headers = [
            'site_id', 'address', 'city', 'state', 'metro', 'lat', 'lng',
            'composite_score', 'bucket', 'data_quality_grade', 'rank',
            'ev_score', 'population', 'ev_ownership', 'ev_usage_demand',
            'street_traffic', 'income', 'proximity_amenities', 'foot_traffic',
            'mall_occupancy', 'retailers',
        ];

        const csvRows = [headers.join(',')];
        (sites ?? []).forEach((s) => {
            const fs = s.factor_scores as Record<string, number> | null;
            csvRows.push([
                s.site_id, `"${s.address}"`, s.city, s.state, `"${s.metro}"`, s.lat, s.lng,
                s.composite_score?.toFixed(1), s.bucket, s.data_quality_grade, s.rank ?? '',
                fs?.evScore ?? '', fs?.population ?? '', fs?.evOwnership ?? '',
                fs?.evUsageDemand ?? '', fs?.streetTraffic ?? '', fs?.income ?? '',
                fs?.proximityAmenities ?? '', fs?.footTraffic ?? '',
                fs?.mallOccupancy ?? '', fs?.retailers ?? '',
            ].join(','));
        });

        const csv = csvRows.join('\n');

        // Audit log
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('name, role').eq('id', user.id).single();
            await supabase.from('audit_logs').insert({
                user_id: user.id,
                user_name: profile?.name ?? '',
                user_role: profile?.role ?? '',
                action: 'csv_export',
                details: `Exported top ${limit} sites${metro ? ` for ${metro}` : ''}`,
                status: 'success',
            });
        }

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="siteiq-export-${Date.now()}.csv"`,
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
