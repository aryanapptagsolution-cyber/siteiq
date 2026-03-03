'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AuditEvent } from '@/types/audit';

interface UseAuditOptions {
    page?: number;
    pageSize?: number;
    action?: string;
}

export function useAudit(options: UseAuditOptions = {}) {
    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refetchCount, setRefetchCount] = useState(0);

    const refetch = useCallback(() => setRefetchCount((c) => c + 1), []);

    useEffect(() => {
        let cancelled = false;

        async function fetchAudit() {
            setIsLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const params = new URLSearchParams();
                if (options.page) params.set('page', String(options.page));
                if (options.pageSize) params.set('pageSize', String(options.pageSize));
                if (options.action && options.action !== 'all') params.set('action', options.action);

                const res = await fetch(`/api/audit?${params}`, {
                    headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
                });
                if (!res.ok) throw new Error('Failed to fetch audit log');
                const data = await res.json();
                if (!cancelled) {
                    setEvents(data.events ?? []);
                    setTotal(data.total ?? 0);
                }
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchAudit();
        return () => { cancelled = true; };
    }, [options.page, options.pageSize, options.action, refetchCount]);

    return { events, total, isLoading, error, refetch };
}
