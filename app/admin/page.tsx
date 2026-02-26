'use client';
import { useState, useEffect, useRef } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import {
    Play, RefreshCw, Database, AlertTriangle, CheckCircle, Clock, Activity, XCircle, Layers, Star
} from 'lucide-react';

const MOCK_JOB_LOGS = [
    { t: '[08:30:01]', level: 'INFO', msg: 'Starting full ingestion pipeline...' },
    { t: '[08:30:15]', level: 'INFO', msg: 'Connecting to Census Bureau API...' },
    { t: '[08:30:45]', level: 'SUCCESS', msg: 'Census Bureau — 12,304 records fetched' },
    { t: '[08:31:02]', level: 'INFO', msg: 'Fetching OpenStreetMap data...' },
    { t: '[08:31:12]', level: 'WARN', msg: 'Rate limit hit on OpenStreetMap API, retrying in 2s...' },
    { t: '[08:32:05]', level: 'ERROR', msg: 'Utility API timeout — Riverside Metro (retrying 1/3)' },
    { t: '[08:32:35]', level: 'SUCCESS', msg: 'Utility API recovered — 4,188 records fetched' },
    { t: '[08:33:01]', level: 'SUCCESS', msg: 'Normalization complete — 28,477 valid records processed' },
    { t: '[08:33:12]', level: 'INFO', msg: 'Ingestion pipeline complete. Job ID: JOB-2026-0225-001' },
];

const MOCK_JOBS = [
    { id: 'JOB-0225-001', triggeredBy: 'Mike Torres', started: '2026-02-25 08:30 AM', duration: '3m 12s', records: 28491, errors: 14, status: 'completed' },
    { id: 'JOB-0224-002', triggeredBy: 'System', started: '2026-02-24 08:00 AM', duration: '4m 05s', records: 27288, errors: 0, status: 'completed' },
    { id: 'JOB-0223-001', triggeredBy: 'Mike Torres', started: '2026-02-23 11:22 AM', duration: '1m 48s', records: 0, errors: 3, status: 'failed' },
    { id: 'JOB-0222-001', triggeredBy: 'System', started: '2026-02-22 08:00 AM', duration: '3m 55s', records: 26991, errors: 2, status: 'completed' },
];

const MOCK_PRESETS = [
    { id: 'default', name: 'Default', isSystem: true, createdBy: 'System', date: '—', factors: ['EV Score 25%', 'Population 15%', 'EV Ownership 12%'] },
    { id: 'urban', name: 'Urban Dense', isSystem: false, createdBy: 'John Doe', date: 'Jan 15, 2026', factors: ['EV Score 30%', 'Foot Traffic 20%', 'Income 15%'] },
    { id: 'suburban', name: 'Suburban Spread', isSystem: false, createdBy: 'Sarah Chen', date: 'Jan 22, 2026', factors: ['Population 25%', 'Street Traffic 20%', 'EV Ownership 15%'] },
    { id: 'traffic', name: 'High-Traffic Corridor', isSystem: false, createdBy: 'John Doe', date: 'Feb 01, 2026', factors: ['Street Traffic 30%', 'Foot Traffic 25%', 'Mall Occupancy 15%'] },
];

export default function AdminPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const { can } = usePermissions();
    const [tab, setTab] = useState<'ingestion' | 'presets'>('ingestion');
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const logRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isAuthenticated) router.replace('/login');
    }, [isAuthenticated, router]);

    if (!can('run_ingestion') && !can('manage_presets')) {
        return (
            <AppShell>
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <p className="text-slate-700 font-semibold">Access Denied</p>
                        <p className="text-slate-400 text-sm mt-1">Admin or Planner role required</p>
                    </div>
                </div>
            </AppShell>
        );
    }

    const runIngestion = () => {
        setRunning(true);
        setProgress(0);
        const interval = setInterval(() => {
            setProgress((p) => {
                if (p >= 100) { clearInterval(interval); setRunning(false); return 100; }
                return p + 2;
            });
        }, 120);
    };

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            completed: 'bg-emerald-100 text-emerald-700',
            failed: 'bg-red-100 text-red-700',
            running: 'bg-indigo-100 text-indigo-700',
            queued: 'bg-amber-100 text-amber-700',
        };
        return <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>{status}</span>;
    };

    return (
        <AppShell>
            <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-slate-900">Administration</h1>
                    <span className="text-xs bg-red-100 text-red-700 font-bold uppercase tracking-widest px-3 py-1 rounded-full">Admin Panel</span>
                </div>

                {/* Tab bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1 flex gap-1 max-w-xs">
                    {(['ingestion', 'presets'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`flex-1 py-2 text-sm font-semibold rounded-xl capitalize transition-colors ${tab === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            {t === 'ingestion' ? 'Data Ingestion' : 'Global Presets'}
                        </button>
                    ))}
                </div>

                {tab === 'ingestion' && (
                    <>
                        {/* KPI cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { icon: Clock, color: 'text-indigo-600', label: 'Last Run', value: 'Feb 25, 2026 08:30 AM', sub: '15 minutes ago' },
                                { icon: Database, color: 'text-emerald-600', label: 'Records Processed', value: '28,491', sub: '+1,203 new' },
                                { icon: AlertTriangle, color: 'text-amber-500', label: 'Errors Found', value: '14', sub: '3 critical' },
                                { icon: Activity, color: 'text-emerald-600', label: 'Job Status', value: 'Completed', sub: '✓ Healthy' },
                            ].map(({ icon: Icon, color, label, value, sub }) => (
                                <div key={label} className="bg-white rounded-2xl shadow-md p-4 flex items-start gap-3">
                                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${color}`} />
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                                        <p className="font-bold text-slate-900">{value}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Ingestion Control */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-1">Run Ingestion Job</h2>
                            <p className="text-sm text-slate-500 mb-4">Trigger a full data pipeline refresh from all configured sources.</p>
                            <div className="flex flex-wrap gap-3 mb-4">
                                <select className="h-9 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                                    <option>All Sources</option>
                                    <option>Census Bureau</option>
                                    <option>OpenStreetMap</option>
                                    <option>Utility API</option>
                                    <option>Google Maps</option>
                                </select>
                                <select className="h-9 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                                    <option>All Metros</option>
                                    <option>Los Angeles, CA</option>
                                    <option>San Francisco, CA</option>
                                    <option>New York City, NY</option>
                                </select>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button onClick={runIngestion} disabled={running || !can('run_ingestion')}
                                    className="flex items-center gap-2 h-10 px-6 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition-colors">
                                    <Play className="w-4 h-4" /> Run Full Ingestion
                                </button>
                                <button className="flex items-center gap-2 h-10 px-4 border border-indigo-200 text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-50 transition-colors">
                                    <RefreshCw className="w-4 h-4" /> Reprocess Normalization
                                </button>
                            </div>
                            {running && (
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>Processing records...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Job history */}
                        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="font-bold text-slate-900">Job History</h2>
                                <span className="text-xs text-indigo-600 font-medium cursor-pointer hover:underline">View all →</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50">
                                            {['Job ID', 'Triggered By', 'Started', 'Duration', 'Records', 'Errors', 'Status', 'Logs'].map((h) => (
                                                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {MOCK_JOBS.map((job, i) => (
                                            <tr key={job.id} className={`border-b border-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                                                <td className="px-4 py-3 font-mono text-xs text-indigo-600">{job.id}</td>
                                                <td className="px-4 py-3 text-slate-700">{job.triggeredBy}</td>
                                                <td className="px-4 py-3 text-slate-500 text-xs">{job.started}</td>
                                                <td className="px-4 py-3 text-slate-500 text-xs">{job.duration}</td>
                                                <td className="px-4 py-3 font-semibold text-slate-900">{job.records.toLocaleString()}</td>
                                                <td className="px-4 py-3">
                                                    {job.errors > 0 ? (
                                                        <span className="text-red-500 font-semibold">{job.errors}</span>
                                                    ) : (
                                                        <span className="text-emerald-600">0</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">{statusBadge(job.status)}</td>
                                                <td className="px-4 py-3">
                                                    <button className="text-xs text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors">View Logs</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Log viewer */}
                        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="font-bold text-slate-900">Job Logs — JOB-0225-001</h2>
                            </div>
                            <div ref={logRef} className="bg-slate-900 rounded-b-2xl p-4 font-mono text-xs h-44 overflow-y-auto space-y-1">
                                {MOCK_JOB_LOGS.map((log, i) => (
                                    <div key={i} className="flex gap-2">
                                        <span className="text-slate-500 shrink-0">{log.t}</span>
                                        <span className={log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-amber-400' : log.level === 'SUCCESS' ? 'text-emerald-400' : 'text-slate-300'}>
                                            [{log.level}]
                                        </span>
                                        <span className="text-slate-300">{log.msg}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {tab === 'presets' && (
                    <>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Global Weight Presets</h2>
                                <p className="text-slate-400 text-sm">Manage presets available to all users</p>
                            </div>
                            {can('manage_presets') && (
                                <button className="flex items-center gap-2 h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
                                    + Create New Preset
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {MOCK_PRESETS.map((preset) => (
                                <div key={preset.id} className="bg-white rounded-2xl shadow-md p-5 space-y-3 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                                                {preset.isSystem ? <Star className="w-4 h-4 text-indigo-600" /> : <Layers className="w-4 h-4 text-indigo-600" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{preset.name}</p>
                                                {preset.isSystem && (
                                                    <span className="text-[10px] text-slate-400">System Preset</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {preset.factors.map((f) => (
                                            <span key={f} className="text-[10px] bg-indigo-50 text-indigo-600 font-medium px-2 py-0.5 rounded-full">{f}</span>
                                        ))}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        By {preset.createdBy} {preset.date !== '—' && `· ${preset.date}`}
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <button className="flex-1 h-8 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">Load</button>
                                        {!preset.isSystem && can('manage_presets') && (
                                            <>
                                                <button className="h-8 px-3 text-xs text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors">Edit</button>
                                                <button className="h-8 px-3 text-xs text-red-500 border border-red-100 hover:bg-red-50 rounded-lg transition-colors">Delete</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {/* Create new card */}
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex items-center justify-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer group min-h-[180px]">
                                <div className="text-center">
                                    <p className="text-3xl text-slate-300 group-hover:text-indigo-400 transition-colors mb-1">+</p>
                                    <p className="text-sm text-slate-400 group-hover:text-indigo-500 font-medium">Create Preset</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AppShell>
    );
}
