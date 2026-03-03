'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useAudit } from '@/hooks/useAudit';
import { useRouter } from 'next/navigation';
import { ACTION_LABELS, ACTION_COLORS, AuditActionType } from '@/types/audit';
import { Shield, Loader2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const ACTION_TYPES: AuditActionType[] = [
    'weight_change', 'preset_loaded', 'preset_created', 'preset_deleted',
    'ingestion_run', 'csv_export', 'pdf_export', 'site_view',
    'login_success', 'login_failed', 'rollback', 'file_upload',
];

export default function AuditPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const { can } = usePermissions();

    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState('all');
    const pageSize = 20;

    const { events, total, isLoading } = useAudit({ page, pageSize, action: actionFilter });

    useEffect(() => {
        if (!isAuthenticated) router.replace('/login');
    }, [isAuthenticated, router]);

    if (!isAuthenticated || !can('view_audit')) return null;

    const totalPages = Math.ceil(total / pageSize);

    return (
        <AppShell>
            <div className="p-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
                        <p className="text-sm text-slate-500">{total} events recorded</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <button
                        onClick={() => { setActionFilter('all'); setPage(1); }}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${actionFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        All Events
                    </button>
                    {ACTION_TYPES.map((at) => (
                        <button
                            key={at}
                            onClick={() => { setActionFilter(at); setPage(1); }}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${actionFilter === at
                                ? `${ACTION_COLORS[at] ?? 'bg-slate-100'} text-white`
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {ACTION_LABELS[at] ?? at}
                        </button>
                    ))}
                </div>

                {/* Events list */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-sm">
                        <Shield className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                        No events found
                    </div>
                ) : (
                    <div className="space-y-2 mb-6">
                        {events.map((event) => (
                            <div key={event.id} className="flex items-start gap-4 bg-white border border-slate-200 rounded-xl px-4 py-3">
                                <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${event.status === 'failed' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-semibold text-slate-900">{event.userName || 'System'}</span>
                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full uppercase">
                                            {event.userRole}
                                        </span>
                                        <span className="text-xs text-slate-400 ml-auto shrink-0">
                                            {new Date(event.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600">{event.details}</p>
                                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${ACTION_COLORS[event.action as AuditActionType] ?? 'bg-slate-100 text-slate-600'}`}>
                                        {ACTION_LABELS[event.action as AuditActionType] ?? event.action}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                            className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-slate-600">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(page + 1)}
                            className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
