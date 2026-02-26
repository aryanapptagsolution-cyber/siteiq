'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { Download, CheckCircle, XCircle, RotateCcw, X } from 'lucide-react';
import { AuditEvent, ACTION_LABELS, ACTION_COLORS, AuditActionType } from '@/types/audit';

const MOCK_EVENTS: AuditEvent[] = [
    { id: '1', timestamp: '2026-02-25 09:42 AM', userId: 'u1', userName: 'Sarah Chen', userRole: 'Analyst', action: 'weight_change', details: 'EV Score weight updated', before: '20%', after: '25%', ipAddress: '192.168.1.42', status: 'success' },
    { id: '2', timestamp: '2026-02-25 09:38 AM', userId: 'u2', userName: 'John Doe', userRole: 'Planner', action: 'preset_loaded', details: 'Urban Dense preset activated', before: 'Default', after: 'Urban Dense', ipAddress: '10.0.0.15', status: 'success' },
    { id: '3', timestamp: '2026-02-25 09:15 AM', userId: 'u3', userName: 'Mike Torres', userRole: 'Admin', action: 'ingestion_run', details: 'Full pipeline — All Sources', before: '27,288', after: '28,491', status: 'success' },
    { id: '4', timestamp: '2026-02-25 08:55 AM', userId: 'u1', userName: 'Sarah Chen', userRole: 'Analyst', action: 'csv_export', details: 'Top 50 sites, LA Metro', ipAddress: '192.168.1.42', status: 'success' },
    { id: '5', timestamp: '2026-02-25 08:30 AM', userId: 'system', userName: 'System', userRole: '—', action: 'ingestion_run', details: 'Scheduled daily run', status: 'success' },
    { id: '6', timestamp: '2026-02-24 11:22 PM', userId: '?', userName: 'Unknown', userRole: '—', action: 'login_failed', details: 'Failed: Invalid credentials', ipAddress: '203.45.67.89', status: 'failed' },
    { id: '7', timestamp: '2026-02-24 05:15 PM', userId: 'u4', userName: 'Jessica Park', userRole: 'Viewer', action: 'site_view', details: 'Site #LA-2847 accessed', ipAddress: '10.0.0.31', status: 'success' },
    { id: '8', timestamp: '2026-02-24 03:10 PM', userId: 'u1', userName: 'Sarah Chen', userRole: 'Analyst', action: 'weight_change', details: 'Population weight updated', before: '18%', after: '15%', ipAddress: '192.168.1.42', status: 'success' },
    { id: '9', timestamp: '2026-02-24 01:45 PM', userId: 'u2', userName: 'John Doe', userRole: 'Planner', action: 'preset_created', details: 'High-Traffic Corridor preset created', status: 'success' },
    { id: '10', timestamp: '2026-02-23 11:00 AM', userId: 'u3', userName: 'Mike Torres', userRole: 'Admin', action: 'pdf_export', details: 'Site LA-0023 PDF exported', status: 'success' },
];

const ACTION_FILTER_LABELS: { key: string; label: string }[] = [
    { key: 'all', label: 'All Actions' },
    { key: 'weight_change', label: 'Weight Changes' },
    { key: 'preset_loaded', label: 'Preset Changes' },
    { key: 'ingestion_run', label: 'Ingestion Runs' },
    { key: 'csv_export', label: 'Exports' },
    { key: 'site_view', label: 'Site Views' },
    { key: 'login_failed', label: 'Login Events' },
];

export default function AuditPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const { can } = usePermissions();
    const [activeFilter, setActiveFilter] = useState('all');
    const [rollbackEvent, setRollbackEvent] = useState<AuditEvent | null>(null);

    useEffect(() => {
        if (!isAuthenticated) router.replace('/login');
    }, [isAuthenticated, router]);

    if (!can('view_audit')) {
        return (
            <AppShell>
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <p className="text-slate-700 font-semibold">Access Denied</p>
                        <p className="text-slate-400 text-sm mt-1">Planner or Admin role required</p>
                    </div>
                </div>
            </AppShell>
        );
    }

    const filteredEvents = MOCK_EVENTS.filter(
        (e) => activeFilter === 'all' || e.action === activeFilter
    );

    const stats = [
        { label: 'Total Events', value: MOCK_EVENTS.length },
        { label: 'Weight Changes', value: MOCK_EVENTS.filter((e) => e.action === 'weight_change').length },
        { label: 'Exports', value: MOCK_EVENTS.filter((e) => e.action === 'csv_export' || e.action === 'pdf_export').length },
        { label: 'Ingestion Runs', value: MOCK_EVENTS.filter((e) => e.action === 'ingestion_run').length },
    ];

    return (
        <AppShell>
            <div className="p-6 space-y-5 max-w-[1400px] mx-auto relative">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Audit Log</h1>
                        <p className="text-slate-400 text-sm mt-1">Complete history of system actions, weight changes, and exports</p>
                    </div>
                    <button className="flex items-center gap-2 h-9 px-4 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors">
                        <Download className="w-4 h-4" /> Export Audit CSV
                    </button>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map(({ label, value }) => (
                        <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                            <p className="text-2xl font-bold text-slate-900">{value}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 flex items-center gap-2 flex-wrap">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mr-2 font-semibold">Filters</p>
                    {ACTION_FILTER_LABELS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setActiveFilter(key)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${activeFilter === key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Audit table */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-bold text-slate-900">Event Log</h2>
                        <span className="text-xs text-slate-400">{filteredEvents.length} records</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    {['Timestamp', 'User', 'Role', 'Action', 'Details', 'Before → After', 'IP', 'Status'].map((h) => (
                                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                                    ))}
                                    <th className="px-4 py-2.5" />
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEvents.map((event, i) => (
                                    <tr key={event.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 !== 0 ? 'bg-slate-50/40' : ''}`}>
                                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{event.timestamp}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-[10px] font-bold shrink-0">
                                                    {event.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <span className="text-xs font-medium text-slate-800 whitespace-nowrap">{event.userName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{event.userRole}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${ACTION_COLORS[event.action]}`}>
                                                {ACTION_LABELS[event.action]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px] truncate">{event.details}</td>
                                        <td className="px-4 py-3">
                                            {event.before && event.after ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded-md">{event.before}</span>
                                                    <span className="text-slate-300 text-xs">→</span>
                                                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">{event.after}</span>
                                                </div>
                                            ) : <span className="text-slate-300 text-xs">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">{event.ipAddress ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            {event.status === 'success'
                                                ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                : <XCircle className="w-4 h-4 text-red-500" />}
                                        </td>
                                        <td className="px-4 py-3">
                                            {event.before && event.after && (
                                                <button
                                                    onClick={() => setRollbackEvent(event)}
                                                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 px-2 py-1 rounded-lg transition-colors"
                                                >
                                                    <RotateCcw className="w-3 h-3" /> Rollback
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Rollback side panel */}
            {rollbackEvent && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setRollbackEvent(null)} />
                    <div className="w-96 bg-white shadow-2xl flex flex-col h-full">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-bold text-slate-900 flex items-center gap-2">
                                <RotateCcw className="w-4 h-4 text-amber-500" /> Rollback Event
                            </h2>
                            <button onClick={() => setRollbackEvent(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <p className="text-sm text-amber-700 font-medium">
                                    You are about to rollback a change by <strong>{rollbackEvent.userName}</strong>
                                </p>
                                <p className="text-xs text-amber-600 mt-1">{rollbackEvent.details}</p>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                                    <p className="text-[10px] uppercase tracking-widest text-red-400 mb-1">Current (After)</p>
                                    <p className="text-sm font-semibold text-red-700">{rollbackEvent.after}</p>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                    <p className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">Will Restore (Before)</p>
                                    <p className="text-sm font-semibold text-emerald-700">{rollbackEvent.before}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-slate-100 space-y-2">
                            <button className="w-full h-10 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors">
                                Confirm Rollback
                            </button>
                            <button onClick={() => setRollbackEvent(null)} className="w-full h-10 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
