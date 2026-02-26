'use client';
import { use, useMemo } from 'react';
import { MapPin, Zap, AlertTriangle, Lock, ArrowLeft, Download, CheckCircle, XCircle } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { usePermissions } from '@/hooks/usePermissions';
import { MOCK_SITES } from '@/utils/mockData';
import { FACTOR_LABELS } from '@/types/site';
import { getScoreColorClass, getScoreBarColor, getBucketColorClass, getBucketLabel } from '@/utils/scoreColor';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { useWeightStore } from '@/store/weightStore';

export default function SiteDetailPage({ params }: { params: Promise<{ siteId: string }> }) {
    const { siteId } = use(params);
    const { can } = usePermissions();
    const normalizedWeights = useWeightStore((s) => s.normalizedWeights);
    const site = useMemo(() => MOCK_SITES.find((s) => s.id === siteId) ?? MOCK_SITES[0], [siteId]);

    const chartData = useMemo(() =>
        (Object.entries(site.factorScores) as [keyof typeof FACTOR_LABELS, number][]).map(([key, value]) => ({
            name: FACTOR_LABELS[key],
            value,
            weight: normalizedWeights[key],
        })),
        [site, normalizedWeights]
    );

    const permitColor = site.utilityInfo?.permitStatus === 'approved' ? 'text-emerald-600' : site.utilityInfo?.permitStatus === 'pending' ? 'text-amber-600' : 'text-red-600';

    return (
        <AppShell>
            <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
                {/* Site header */}
                <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${getBucketColorClass(site.bucket)}`}>
                                {getBucketLabel(site.bucket)}
                            </span>
                            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-3 py-1 rounded-full">
                                {site.metro}
                            </span>
                            <Link href="/dashboard" className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700">
                                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                            </Link>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900">{site.siteId}</h1>
                        <p className="text-slate-500">{site.address}, {site.city}, {site.state}</p>
                        <p className="text-[11px] text-slate-400">Score timestamp: {new Date(site.scoreTimestamp).toLocaleString()}</p>
                    </div>
                    {/* Score */}
                    <div className="text-center shrink-0">
                        <p className={`text-7xl font-extrabold leading-none ${getScoreColorClass(site.compositeScore)}`}>
                            {site.compositeScore.toFixed(1)}
                        </p>
                        <p className="text-slate-400 text-lg">/ 100</p>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Composite Score</p>
                        <span className={`mt-2 inline-flex text-sm font-bold w-10 h-10 rounded-full items-center justify-center ${site.dataQualityGrade === 'A' ? 'bg-emerald-100 text-emerald-700' : site.dataQualityGrade === 'B' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                            {site.dataQualityGrade}
                        </span>
                    </div>
                </div>

                {/* Two-column */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                    {/* Left col */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Map snapshot */}
                        <div className="bg-white rounded-2xl shadow-md p-4">
                            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-600" /> Location</h2>
                            <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v11/static/-118.2437,34.0522,13,0/600x300?access_token=pk.placeholder')] bg-cover bg-center opacity-50" />
                                <div className="relative z-10 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                                    <Zap className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Data sources */}
                        <div className="bg-white rounded-2xl shadow-md p-4">
                            <h2 className="text-[10px] uppercase tracking-widest text-slate-400 mb-3 font-semibold">Source Lineage</h2>
                            <div className="space-y-2">
                                {site.dataSources.map((src) => (
                                    <div key={src.name} className="flex items-center gap-3">
                                        {src.status === 'synced'
                                            ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                            : <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                        }
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800">{src.name}</p>
                                            <p className="text-xs text-slate-400">Last synced: {src.lastSynced}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Missing fields */}
                        {site.missingFields.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-amber-400">
                                <h2 className="text-sm font-bold text-amber-700 flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4" /> Data Gaps ({site.missingFields.length})
                                </h2>
                                {site.missingFields.map((f) => (
                                    <div key={f} className="flex items-center gap-2 text-xs text-slate-600 py-1">
                                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />{f}
                                        <span className="ml-auto text-slate-400">Not Available</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right col */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Score breakdown */}
                        <div className="bg-white rounded-2xl shadow-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold text-slate-900">Factor Score Breakdown</h2>
                                <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2 py-1 rounded-full">Weights Applied</span>
                            </div>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={chartData} layout="vertical" margin={{ left: 130, right: 40, top: 0, bottom: 0 }}>
                                    <XAxis type="number" domain={[0, 100]} tickCount={6} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }} width={120} />
                                    <Tooltip
                                        formatter={(value, _name, props) => {
                                            const v = (value as number) ?? 0;
                                            const w = (props.payload?.weight as number) ?? 0;
                                            return [`Score: ${v.toFixed(1)} (Weight: ${w.toFixed(1)}%)`, ''];
                                        }}
                                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
                                        {chartData.map((entry, i) => (
                                            <Cell key={i} fill={getScoreBarColor(entry.value)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Utility info */}
                        {site.utilityInfo && (
                            <div className="bg-white rounded-2xl shadow-md p-4">
                                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                                    {site.utilityInfo.flagged && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                    Utility Constraints
                                </h2>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Provider</span>
                                        <span className="font-medium">{site.utilityInfo.provider}</span>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-slate-500">Grid Capacity</span>
                                            <span className={`font-medium ${site.utilityInfo.gridCapacityPct > 80 ? 'text-red-500' : site.utilityInfo.gridCapacityPct > 60 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                                {site.utilityInfo.gridCapacityPct}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full bg-amber-400" style={{ width: `${site.utilityInfo.gridCapacityPct}%` }} />
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Interconnection Queue</span>
                                        <span className="font-semibold text-amber-600">{site.utilityInfo.interconnectionQueueMonths} months</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Permit Status</span>
                                        <span className={`font-semibold capitalize ${permitColor}`}>
                                            {site.utilityInfo.permitStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Owner info — role-gated */}
                <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                    <div className="bg-slate-900 px-6 py-3">
                        <p className="text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                            <Lock className="w-4 h-4" /> Owner Information — Restricted
                        </p>
                    </div>
                    <div className="p-5">
                        {can('view_pii') ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
                                {[
                                    ['Owner Name', site.owner?.name],
                                    ['Email', site.owner?.email],
                                    ['Phone', site.owner?.phone],
                                    ['Property Type', site.owner?.propertyType],
                                    ['Parcel ID', site.owner?.parcelId],
                                    ['Lease Status', site.owner?.leaseStatus],
                                ].map(([label, value]) => (
                                    <div key={label as string}>
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
                                        <p className="font-medium text-slate-900">{value ?? '—'}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 text-slate-400 py-4">
                                <Lock className="w-5 h-5 shrink-0" />
                                <p className="text-sm">Analyst role or higher required to view owner information.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 flex-wrap pb-4">
                    <button className="flex items-center gap-2 h-10 px-5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors">
                        <Download className="w-4 h-4" /> Export PDF Report
                    </button>
                    <button className="flex items-center gap-2 h-10 px-5 bg-white border border-amber-300 text-amber-700 text-sm font-semibold rounded-lg hover:bg-amber-50 transition-colors">
                        <AlertTriangle className="w-4 h-4" /> Flag for Review
                    </button>
                    <Link href="/dashboard" className="flex items-center gap-2 h-10 px-5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                </div>
            </div>
        </AppShell>
    );
}
