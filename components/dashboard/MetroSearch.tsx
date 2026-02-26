'use client';
import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useMetroStore, Metro } from '@/store/metroStore';
import { useFilterStore } from '@/store/filterStore';
import { useDebounce } from '@/hooks/useDebounce';

// Static mock metro data — replaces API search in demo mode
const MOCK_METROS: Metro[] = [
    { id: 'la', name: 'Los Angeles', state: 'CA', center: [-118.2437, 34.0522], bbox: [-118.9, 33.7, -117.6, 34.4] },
    { id: 'sf', name: 'San Francisco', state: 'CA', center: [-122.4194, 37.7749], bbox: [-123.0, 37.3, -121.8, 38.2] },
    { id: 'nyc', name: 'New York City', state: 'NY', center: [-74.006, 40.7128], bbox: [-74.3, 40.4, -73.7, 40.95] },
    { id: 'chi', name: 'Chicago', state: 'IL', center: [-87.6298, 41.8781], bbox: [-88.0, 41.5, -87.2, 42.2] },
    { id: 'hou', name: 'Houston', state: 'TX', center: [-95.3698, 29.7604], bbox: [-95.9, 29.4, -94.9, 30.1] },
    { id: 'phx', name: 'Phoenix', state: 'AZ', center: [-112.074, 33.4484], bbox: [-112.6, 33.1, -111.5, 33.9] },
    { id: 'sea', name: 'Seattle', state: 'WA', center: [-122.3321, 47.6062], bbox: [-122.7, 47.4, -121.9, 47.9] },
    { id: 'den', name: 'Denver', state: 'CO', center: [-104.9903, 39.7392], bbox: [-105.2, 39.5, -104.6, 40.0] },
];

export default function MetroSearch() {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const debouncedQuery = useDebounce(query, 200);
    const inputRef = useRef<HTMLInputElement>(null);
    const { selectedMetro, setSelectedMetro } = useMetroStore();
    const resetFilters = useFilterStore((s) => s.resetFilters);

    const filtered = debouncedQuery.length > 0
        ? MOCK_METROS.filter((m) => `${m.name} ${m.state}`.toLowerCase().includes(debouncedQuery.toLowerCase()))
        : MOCK_METROS;

    const handleSelect = (metro: Metro) => {
        setSelectedMetro(metro);
        setQuery(metro.name + ', ' + metro.state);
        setOpen(false);
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
            </div>
            {open && filtered.length > 0 && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 max-h-60 overflow-y-auto">
                    {filtered.map((metro) => (
                        <button
                            key={metro.id}
                            onMouseDown={() => handleSelect(metro)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left"
                        >
                            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-sm text-slate-900">{metro.name}</span>
                            <span className="text-xs text-slate-400 ml-auto">{metro.state}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
