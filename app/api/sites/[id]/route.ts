import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        const supabase = createServerSupabase(token);

        const { data: row, error } = await supabase
            .from('sites')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !row) {
            return NextResponse.json({ error: 'Site not found' }, { status: 404 });
        }

        const site = {
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
            rank: row.rank,
        };

        return NextResponse.json(site);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
