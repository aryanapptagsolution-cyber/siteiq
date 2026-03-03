'use client';
import { useEffect, useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useMetroStore, Metro } from '@/store/metroStore';
import { useFilterStore } from '@/store/filterStore';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/lib/supabase';

export default function MetroSearch() {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [metros, setMetros] = useState<Metro[]>([]);
    const [loading, setLoading] = useState(false);
    const debouncedQuery = useDebounce(query, 200);
    const inputRef = useRef<HTMLInputElement>(null);
    const { selectedMetro, setSelectedMetro } = useMetroStore();
    const resetFilters = useFilterStore((s) => s.resetFilters);

    // Fetch metros from API
    useEffect(() => {
        let cancelled = false;
        async function fetchMetros() {
            setLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch('/api/metros', {
                    headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled) setMetros(data);
                }
            } catch {
                // Silently fail
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchMetros();
        return () => { cancelled = true; };
    }, []);

    const filtered = debouncedQuery.length > 0
        ? metros.filter((m) => `${m.name} ${m.state}`.toLowerCase().includes(debouncedQuery.toLowerCase()))
        : metros;

    const handleSelect = (metro: Metro) => {
        setSelectedMetro(metro);
        setQuery(metro.name + ', ' + metro.state);
        setOpen(false);
        resetFilters();
    };

    const handleClear = () => {
        setSelectedMetro(null);
        setQuery('');
        resetFilters();
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!inputRef.current?.closest('.metro-search')?.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="metro-search relative w-full">
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    placeholder={selectedMetro ? `${selectedMetro.name}, ${selectedMetro.state}` : 'Search metro or city...'}
                    className="w-full pl-10 pr-4 h-9 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition"
                />
                {selectedMetro && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                        ✕
                    </button>
                )}
            </div>
            {open && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 max-h-60 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-400 text-center">
                            {metros.length === 0 ? 'No metros — upload site data first' : 'No matches'}
                        </div>
                    ) : (
                        filtered.map((metro) => (
                            <button
                                key={metro.id}
                                onMouseDown={() => handleSelect(metro)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left"
                            >
                                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="text-sm text-slate-900">{metro.name}</span>
                                <span className="text-xs text-slate-400 ml-auto">{metro.state}</span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
