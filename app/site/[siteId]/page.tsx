'use client';
import { useEffect, use } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useSiteDetail } from '@/hooks/useSites';
import { useWeightStore } from '@/store/weightStore';
import { FACTOR_LABELS } from '@/types/site';
import { getScoreColorClass, getBucketColorClass, getBucketLabel, getScoreBarColor } from '@/utils/scoreColor';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
    ArrowLeft, MapPin, Loader2, AlertTriangle,
    Building, Phone, Mail, Gauge, Clock,
} from 'lucide-react';
import Link from 'next/link';

export default function SiteDetailPage({ params }: { params: Promise<{ siteId: string }> }) {
    const { siteId } = use(params);
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const normalizedWeights = useWeightStore((s) => s.normalizedWeights);

    const { site, isLoading, error } = useSiteDetail(siteId);

    useEffect(() => {
        if (!isAuthenticated) router.replace('/login');
    }, [isAuthenticated, router]);

    if (!isAuthenticated) return null;

    if (isLoading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
            </AppShell>
        );
    }

    if (error || !site) {
        return (
            <AppShell>
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <AlertTriangle className="w-10 h-10 mb-3 text-slate-300" />
                    <p className="text-lg font-semibold">Site not found</p>
                    <p className="text-sm text-slate-400 mt-1">{error ?? 'The site may have been removed'}</p>
                    <Link href="/dashboard" className="mt-4 text-indigo-600 hover:underline text-sm flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                </div>
            </AppShell>
        );
    }

    // Chart data
    const chartData = Object.entries(site.factorScores).map(([key, value]) => ({
        name: FACTOR_LABELS[key as keyof typeof FACTOR_LABELS] ?? key,
        score: value as number,
        weight: normalizedWeights[key as keyof typeof normalizedWeights] ?? 0,
    }));

    return (
        <AppShell>
            <div className="p-6 max-w-5xl mx-auto">
                {/* Back link */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 mb-5 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>

                {/* Header */}
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                    {/* Map thumbnail placeholder using OpenStreetMap */}
                    <div className="w-full md:w-72 h-48 rounded-2xl overflow-hidden shadow-lg shrink-0 bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`https://staticmap.openstreetmap.de/staticmap.php?center=${site.lat},${site.lng}&zoom=14&size=400x250&maptype=mapnik&markers=${site.lat},${site.lng},red-pushpin`}
                            alt="Site location map"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-1">{site.address}</h1>
                                <p className="text-slate-500 flex items-center gap-1">
                                    <MapPin className="w-4 h-4" /> {site.city}, {site.state} · {site.metro}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className={`text-4xl font-bold ${getScoreColorClass(site.compositeScore)}`}>
                                    {site.compositeScore.toFixed(1)}
                                </p>
                                <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${getBucketColorClass(site.bucket)}`}>
                                    {getBucketLabel(site.bucket)}
                                </span>
                            </div>
                        </div>

                        {/* Quick stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: 'Site ID', value: site.siteId, icon: Building },
                                { label: 'Quality Grade', value: site.dataQualityGrade, icon: Gauge },
                                { label: 'Rank', value: site.rank ? `#${site.rank}` : '—', icon: Clock },
                                { label: 'Utility Flag', value: site.utilityFlag ? '⚠️ Flagged' : '✓ Clear', icon: AlertTriangle },
                            ].map(({ label, value, icon: Icon }) => (
                                <div key={label} className="bg-white border border-slate-200 rounded-xl p-3">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">{label}</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Factor chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Factor Scores</h2>
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={chartData} layout="vertical" margin={{ left: 120 }}>
                            <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis type="category" dataKey="name" tick={{ fill: '#334155', fontSize: 12 }} width={110} />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={(val: any, _: any, item: any) =>
                                    [`Score: ${Number(val).toFixed(1)}  |  Weight: ${Number(item?.payload?.weight ?? 0).toFixed(1)}%`]
                                }
                            />
                            <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={18}>
                                {chartData.map((entry, i) => (
                                    <Cell key={i} fill={getScoreBarColor(entry.score)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Owner info */}
                    {site.owner && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-5">
                            <h3 className="text-base font-bold text-slate-900 mb-3">Owner Information</h3>
                            <div className="space-y-2">
                                {site.owner.name && (
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <Building className="w-4 h-4 text-slate-400" /> {site.owner.name}
                                    </div>
                                )}
                                {site.owner.email && (
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <Mail className="w-4 h-4 text-slate-400" /> {site.owner.email}
                                    </div>
                                )}
                                {site.owner.phone && (
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <Phone className="w-4 h-4 text-slate-400" /> {site.owner.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Utility info */}
                    {site.utilityInfo && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-5">
                            <h3 className="text-base font-bold text-slate-900 mb-3">Utility Details</h3>
                            <div className="space-y-2 text-sm text-slate-700">
                                <p>Provider: <span className="font-medium">{site.utilityInfo.provider}</span></p>
                                <p>Grid Capacity: <span className="font-medium">{site.utilityInfo.gridCapacityPct}%</span></p>
                                <p>Queue: <span className="font-medium">{site.utilityInfo.interconnectionQueueMonths} months</span></p>
                                <p>Permit: <span className="font-medium capitalize">{site.utilityInfo.permitStatus}</span></p>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {site.notes && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:col-span-2">
                            <h3 className="text-base font-bold text-slate-900 mb-2">Notes</h3>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{site.notes}</p>
                        </div>
                    )}

                    {/* Missing fields */}
                    {site.missingFields && site.missingFields.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 md:col-span-2">
                            <h3 className="text-base font-bold text-amber-800 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> Missing Data Fields
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {site.missingFields.map((f) => (
                                    <span key={f} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">{f}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
