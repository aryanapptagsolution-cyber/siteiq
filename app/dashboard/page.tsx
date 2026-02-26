'use client';
import { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AppShell from '@/components/layout/AppShell';
import ScoringPanel from '@/components/dashboard/ScoringPanel';
import SiteTable from '@/components/table/SiteTable';
import { useWeightStore } from '@/store/weightStore';
import { useMetroStore } from '@/store/metroStore';
import { useAuthStore } from '@/store/authStore';
import { MOCK_SITES } from '@/utils/mockData';
import { computeCompositeScore } from '@/utils/normalizeWeights';
import { useRouter } from 'next/navigation';
import { MapPin, Activity } from 'lucide-react';

// Lazy-load the map to avoid SSR issues with Mapbox
const SiteMap = dynamic(() => import('@/components/map/SiteMap'), { ssr: false });

export default function DashboardPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const normalizedWeights = useWeightStore((s) => s.normalizedWeights);
    const selectedMetro = useMetroStore((s) => s.selectedMetro);
    const [scoringOpen, setScoringOpen] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) router.replace('/login');
    }, [isAuthenticated, router]);

    // Recompute sites with live weights
    const sites = useMemo(() =>
        MOCK_SITES.map((site) => ({
            ...site,
            compositeScore: computeCompositeScore(
                site.factorScores as unknown as Record<string, number>,
                normalizedWeights
            ),
        })).sort((a, b) => b.compositeScore - a.compositeScore)
            .map((s, i) => ({ ...s, rank: i + 1 })),
        [normalizedWeights]
    );

    const stats = useMemo(() => ({
        total: sites.length,
        topScore: sites[0]?.compositeScore.toFixed(1) ?? '—',
        avgScore: (sites.reduce((s, x) => s + x.compositeScore, 0) / sites.length).toFixed(1),
        immediate: sites.filter((s) => s.bucket === 'immediate').length,
    }), [sites]);

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
                    <div className="relative" style={{ height: '55%' }}>
                        <SiteMap sites={sites} />
                        {/* Stat bar overlay */}
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
                        <SiteTable sites={sites} normalizedWeights={normalizedWeights} />
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
