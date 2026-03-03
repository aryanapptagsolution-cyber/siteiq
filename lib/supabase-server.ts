import { createClient } from '@supabase/supabase-js';

// Server-side client — used in Next.js API routes
// Uses the same anon key; RLS enforced via auth token forwarding
export function createServerSupabase(authToken?: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const client = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        },
    });

    return client;
}
