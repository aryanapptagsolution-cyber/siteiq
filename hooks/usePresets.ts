'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Preset, WeightConfig } from '@/types/scoring';

export function usePresets() {
    const [presets, setPresets] = useState<Preset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refetchCount, setRefetchCount] = useState(0);

    const refetch = useCallback(() => setRefetchCount((c) => c + 1), []);

    useEffect(() => {
        let cancelled = false;

        async function fetchPresets() {
            setIsLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch('/api/presets', {
                    headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
                });
                if (!res.ok) throw new Error('Failed to fetch presets');
                const data = await res.json();
                if (!cancelled) setPresets(data);
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchPresets();
        return () => { cancelled = true; };
    }, [refetchCount]);

    const createPreset = async (name: string, weights: WeightConfig, description?: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/presets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session?.access_token ?? ''}`,
            },
            body: JSON.stringify({ name, weights, description }),
        });
        if (!res.ok) {
            const body = await res.json();
            throw new Error(body.error ?? 'Failed to create preset');
        }
        const preset = await res.json();
        refetch();
        return preset;
    };

    const deletePreset = async (id: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`/api/presets/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
        });
        if (!res.ok) throw new Error('Failed to delete preset');
        refetch();
    };

    return { presets, isLoading, error, createPreset, deletePreset, refetch };
}
