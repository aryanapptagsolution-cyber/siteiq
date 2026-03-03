'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Site } from '@/types/site';

interface UseSitesOptions {
    metro?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    buckets?: string[];
    qualityGrades?: string[];
    search?: string;
}

interface UseSitesResult {
    sites: Site[];
    total: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useSites(options: UseSitesOptions = {}): UseSitesResult {
    const [sites, setSites] = useState<Site[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refetchCount, setRefetchCount] = useState(0);

    const refetch = useCallback(() => setRefetchCount((c) => c + 1), []);

    useEffect(() => {
        let cancelled = false;

        async function fetchSites() {
            setIsLoading(true);
            setError(null);

            try {
                const { data: { session } } = await supabase.auth.getSession();

                const params = new URLSearchParams();
                if (options.metro) params.set('metro', options.metro);
                if (options.page) params.set('page', String(options.page));
                if (options.pageSize) params.set('pageSize', String(options.pageSize));
                if (options.sortBy) params.set('sortBy', options.sortBy);
                if (options.sortDir) params.set('sortDir', options.sortDir);
                if (options.buckets?.length) params.set('buckets', options.buckets.join(','));
                if (options.qualityGrades?.length) params.set('qualityGrades', options.qualityGrades.join(','));
                if (options.search) params.set('search', options.search);

                const res = await fetch(`/api/sites?${params}`, {
                    headers: {
                        Authorization: `Bearer ${session?.access_token ?? ''}`,
                    },
                });

                if (!res.ok) {
                    const body = await res.json();
                    throw new Error(body.error ?? 'Failed to fetch sites');
                }

                const data = await res.json();
                if (!cancelled) {
                    setSites(data.sites ?? []);
                    setTotal(data.total ?? 0);
                    setTotalPages(data.totalPages ?? 0);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Unknown error');
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchSites();
        return () => { cancelled = true; };
    }, [
        options.metro, options.page, options.pageSize,
        options.sortBy, options.sortDir,
        options.buckets?.join(','), options.qualityGrades?.join(','),
        options.search, refetchCount,
    ]);

    return { sites, total, totalPages, isLoading, error, refetch };
}

export function useSiteDetail(siteId: string) {
    const [site, setSite] = useState<Site | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchSite() {
            setIsLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();

                const res = await fetch(`/api/sites/${siteId}`, {
                    headers: {
                        Authorization: `Bearer ${session?.access_token ?? ''}`,
                    },
                });

                if (!res.ok) throw new Error('Site not found');
                const data = await res.json();
                if (!cancelled) setSite(data);
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        if (siteId) fetchSite();
        return () => { cancelled = true; };
    }, [siteId]);

    return { site, isLoading, error };
}
