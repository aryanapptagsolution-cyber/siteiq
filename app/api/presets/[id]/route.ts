import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        const supabase = createServerSupabase(token);

        const body = await request.json();
        const { name, weights, description } = body;

        const { data, error } = await supabase
            .from('presets')
            .update({ name, weights, description })
            .eq('id', id)
            .eq('is_system', false) // Prevent editing system presets
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        const supabase = createServerSupabase(token);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await supabase
            .from('presets')
            .delete()
            .eq('id', id)
            .eq('is_system', false); // Prevent deleting system presets

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log
        const { data: profile } = await supabase.from('profiles').select('name, role').eq('id', user.id).single();
        await supabase.from('audit_logs').insert({
            user_id: user.id,
            user_name: profile?.name ?? '',
            user_role: profile?.role ?? '',
            action: 'preset_deleted',
            details: `Deleted preset ${id}`,
            status: 'success',
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
