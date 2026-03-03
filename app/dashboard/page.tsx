'use client';
import { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AppShell from '@/components/layout/AppShell';
import ScoringPanel from '@/components/dashboard/ScoringPanel';
import SiteTable from '@/components/table/SiteTable';
import { useWeightStore } from '@/store/weightStore';
import { useMetroStore } from '@/store/metroStore';
import { useAuthStore } from '@/store/authStore';
import { useSites } from '@/hooks/useSites';
import { useFilterStore } from '@/store/filterStore';
import { useRouter } from 'next/navigation';
import { Site } from '@/types/site';
import { MapPin, Activity, Loader2 } from 'lucide-react';

const SiteMap = dynamic(() => import('@/components/map/SiteMap'), { ssr: false });

export default function DashboardPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const normalizedWeights = useWeightStore((s) => s.normalizedWeights);
    const selectedMetro = useMetroStore((s) => s.selectedMetro);
    const [scoringOpen, setScoringOpen] = useState(true);

    const page = useFilterStore((s) => s.page);
    const pageSize = useFilterStore((s) => s.pageSize);
    const sortBy = useFilterStore((s) => s.sortBy);
    const sortDir = useFilterStore((s) => s.sortDir);
    const buckets = useFilterStore((s) => s.buckets);
    const qualityGrades = useFilterStore((s) => s.qualityGrades);
    const searchQuery = useFilterStore((s) => s.searchQuery);

    useEffect(() => {
        if (!isAuthenticated) router.replace('/login');
    }, [isAuthenticated, router]);

    const { sites: apiSites, total, isLoading } = useSites({
        metro: selectedMetro?.name ? `${selectedMetro.name}, ${selectedMetro.state}` : undefined,
        page,
        pageSize,
        sortBy,
        sortDir,
        buckets,
        qualityGrades,
        search: searchQuery || undefined,
    });

    // RECALCULATE SCORES LIVES BASED ON SLIDERS
    const liveSites = useMemo(() => {
        if (!apiSites || apiSites.length === 0) return [];

        return [...apiSites].map(site => {
            let score = 0;
            for (const [key, val] of Object.entries(site.factorScores)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const w = (normalizedWeights as any)[key] || 0;
                score += val * (w / 100);
            }
            // Derive bucket from new score
            const bucket = (score >= 80 ? 'immediate' : score >= 60 ? 'near-term' : score >= 40 ? 'long-term' : 'gated') as Site['bucket'];
            return { ...site, compositeScore: score, bucket };
        }).sort((a, b) => b.compositeScore - a.compositeScore)
            .map((site, index) => ({ ...site, rank: index + 1 }));
    }, [apiSites, normalizedWeights]);

    const stats = useMemo(() => ({
        total: liveSites.length,
        topScore: liveSites[0]?.compositeScore?.toFixed(1) ?? '—',
        avgScore: liveSites.length > 0
            ? (liveSites.reduce((s, x) => s + x.compositeScore, 0) / liveSites.length).toFixed(1)
            : '—',
        immediate: liveSites.filter((s) => s.bucket === 'immediate').length,
    }), [liveSites]);

    if (!isAuthenticated) return null;

    return (
        <AppShell>
            <div className="flex h-full">
                {/* Scoring sidebar */}
                <div className={`${scoringOpen ? 'w-72' : 'w-0 overflow-hidden'} shrink-0 transition-all duration-300 border-r border-slate-200`}>
                    <ScoringPanel />
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Map section */}
                    <div className="relative bg-slate-100 shrink-0 border-b border-slate-200 z-0" style={{ height: '55%' }}>
                        <SiteMap sites={liveSites} />

                        {isLoading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                            </div>
                        )}

                        {!isLoading && liveSites.length === 0 && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100">
                                <div className="text-center p-8">
                                    <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No sites found</p>
                                    <p className="text-slate-400 text-sm mt-1">Upload site data or clear filters</p>
                                </div>
                            </div>
                        )}

                        {/* Stat bar overlay */}
                        {liveSites.length > 0 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-xl border border-white/50 z-10">
                                {[
                                    { label: 'Sites in View', value: stats.total },
                                    { label: 'Top Score', value: stats.topScore },
                                    { label: 'Avg Score', value: stats.avgScore },
                                    { label: 'Immediate', value: stats.immediate },
                                ].map(({ label, value }) => (
                                    <div key={label} className="text-center">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400">{label}</p>
                                        <p className="text-xl font-bold text-slate-900 leading-none mt-0.5">{value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Scoring toggle button */}
                        <button
                            onClick={() => setScoringOpen(!scoringOpen)}
                            className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white rounded-xl shadow-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <Activity className="w-3.5 h-3.5 text-indigo-600" />
                            {scoringOpen ? 'Hide Weights' : 'Scoring Weights'}
                        </button>
                        {selectedMetro && (
                            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-indigo-600 text-white rounded-xl px-3 py-1.5 text-xs font-semibold shadow-md">
                                <MapPin className="w-3 h-3" />
                                {selectedMetro.name}, {selectedMetro.state}
                            </div>
                        )}
                    </div>

                    {/* Table section */}
                    <div className="flex-1 overflow-hidden mx-4 mb-4 mt-3">
                        <SiteTable sites={liveSites} normalizedWeights={normalizedWeights} isLoading={isLoading} total={total} />
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
