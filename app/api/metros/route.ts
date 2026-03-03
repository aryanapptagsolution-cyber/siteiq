import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        const supabase = createServerSupabase(token);

        // Get distinct metros from sites table
        const { data: sites, error } = await supabase
            .from('sites')
            .select('metro, lat, lng')
            .order('metro');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Group by metro and compute center
        const metroMap = new Map<string, { lats: number[]; lngs: number[] }>();
        (sites ?? []).forEach((s) => {
            if (!s.metro) return;
            if (!metroMap.has(s.metro)) {
                metroMap.set(s.metro, { lats: [], lngs: [] });
            }
            const m = metroMap.get(s.metro)!;
            m.lats.push(s.lat);
            m.lngs.push(s.lng);
        });

        const metros = Array.from(metroMap.entries()).map(([name, { lats, lngs }]) => {
            const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
            const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);

            // Extract state from metro name (e.g. "Los Angeles, CA" → "CA")
            const parts = name.split(',');
            const state = parts.length > 1 ? parts[parts.length - 1].trim() : '';
            const cityName = parts[0].trim();

            return {
                id: cityName.toLowerCase().replace(/\s+/g, '-'),
                name: cityName,
                state,
                center: [avgLng, avgLat] as [number, number],
                bbox: [minLng - 0.05, minLat - 0.05, maxLng + 0.05, maxLat + 0.05] as [number, number, number, number],
            };
        });

        return NextResponse.json(metros);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
