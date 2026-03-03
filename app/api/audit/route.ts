import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        const supabase = createServerSupabase(token);

        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get('page') ?? '1');
        const pageSize = Number(searchParams.get('pageSize') ?? '50');
        const action = searchParams.get('action');
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .order('timestamp', { ascending: false })
            .range(from, to);

        if (action && action !== 'all') {
            query = query.eq('action', action);
        }

        const { data: events, error, count } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const transformed = (events ?? []).map((e) => ({
            id: e.id,
            timestamp: e.timestamp,
            userId: e.user_id,
            userName: e.user_name,
            userRole: e.user_role,
            action: e.action,
            details: e.details,
            before: e.before_val,
            after: e.after_val,
            ipAddress: e.ip_address,
            status: e.status,
        }));

        return NextResponse.json({
            events: transformed,
            total: count ?? 0,
            page,
            pageSize,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
