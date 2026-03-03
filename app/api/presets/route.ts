import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        const supabase = createServerSupabase(token);

        const { data: presets, error } = await supabase
            .from('presets')
            .select('*, profiles!presets_created_by_fkey(name)')
            .order('is_system', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformed = (presets ?? []).map((p: any) => ({
            id: p.id,
            name: p.name,
            weights: p.weights,
            createdBy: p.profiles?.name ?? 'System',
            createdAt: p.created_at,
            isSystem: p.is_system,
            description: p.description ?? '',
        }));

        return NextResponse.json(transformed);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        const supabase = createServerSupabase(token);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, weights, description } = body;

        if (!name || !weights) {
            return NextResponse.json({ error: 'name and weights are required' }, { status: 400 });
        }

        const { data: preset, error } = await supabase
            .from('presets')
            .insert({
                name,
                weights,
                description: description ?? '',
                created_by: user.id,
                is_system: false,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log
        const { data: profile } = await supabase.from('profiles').select('name, role').eq('id', user.id).single();
        await supabase.from('audit_logs').insert({
            user_id: user.id,
            user_name: profile?.name ?? '',
            user_role: profile?.role ?? '',
            action: 'preset_created',
            details: `Created preset "${name}"`,
            status: 'success',
        });

        return NextResponse.json(preset, { status: 201 });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
