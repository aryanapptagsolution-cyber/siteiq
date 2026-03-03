'use client';
import { useState, useCallback, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { usePresets } from '@/hooks/usePresets';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import {
    Upload, FileUp, CheckCircle2, XCircle, Loader2, Trash2,
    Database, Settings2, RefreshCcw, Clock
} from 'lucide-react';

interface UploadResult {
    success: boolean;
    inserted?: number;
    errors?: string[];
    error?: string;
}

interface UploadRecord {
    id: string;
    filename: string;
    file_type: string;
    records_count: number;
    errors_count: number;
    uploaded_at: string;
    status: string;
}

export default function AdminPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const { can } = usePermissions();
    const { presets, deletePreset, refetch: refetchPresets, isLoading: presetsLoading } = usePresets();

    const [tab, setTab] = useState<'ingestion' | 'presets'>('ingestion');
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [uploadHistory, setUploadHistory] = useState<UploadRecord[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) router.replace('/login');
    }, [isAuthenticated, router]);

    // Fetch upload history
    useEffect(() => {
        async function fetchHistory() {
            setHistoryLoading(true);
            try {
                const { data, error } = await supabase
                    .from('uploads')
                    .select('*')
                    .order('uploaded_at', { ascending: false })
                    .limit(20);
                if (!error && data) setUploadHistory(data as UploadRecord[]);
            } catch { /* ignore */ }
            finally { setHistoryLoading(false); }
        }
        fetchHistory();
    }, [uploadResult]); // re-fetch after uploads

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        setUploadResult(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
                body: formData,
            });

            const data = await res.json();
            setUploadResult(data);
        } catch (err) {
            setUploadResult({ success: false, error: err instanceof Error ? err.message : 'Upload failed' });
        } finally {
            setUploading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
        },
        maxFiles: 1,
        disabled: uploading,
    });

    if (!isAuthenticated || !can('run_ingestion')) return null;

    return (
        <AppShell>
            <div className="p-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Settings2 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Admin Console</h1>
                        <p className="text-sm text-slate-500">Data ingestion &amp; preset management</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
                    {(['ingestion', 'presets'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors capitalize ${tab === t
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {t === 'ingestion' ? (
                                <span className="flex items-center justify-center gap-2"><Database className="w-4 h-4" /> Data Ingestion</span>
                            ) : (
                                <span className="flex items-center justify-center gap-2"><Settings2 className="w-4 h-4" /> Presets</span>
                            )}
                        </button>
                    ))}
                </div>

                {tab === 'ingestion' && (
                    <div className="space-y-6">
                        {/* Upload zone */}
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
                                ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
                                ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <input {...getInputProps()} />
                            {uploading ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-3" />
                                    <p className="text-sm font-medium text-slate-700">Processing file…</p>
                                    <p className="text-xs text-slate-400 mt-1">Validating rows and inserting to database</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                                        <Upload className="w-7 h-7 text-indigo-600" />
                                    </div>
                                    <p className="text-base font-semibold text-slate-900">
                                        {isDragActive ? 'Drop it here!' : 'Drag & drop a file here'}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        or <span className="text-indigo-600 underline">click to browse</span>
                                    </p>
                                    <p className="text-xs text-slate-400 mt-3">
                                        Supported formats: <span className="font-medium">CSV, XLSX, XLS</span>
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Required columns: address, city, state, metro, lat, lng + factor scores
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Upload result */}
                        {uploadResult && (
                            <div className={`rounded-2xl p-5 ${uploadResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    {uploadResult.success
                                        ? <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                        : <XCircle className="w-6 h-6 text-red-600" />}
                                    <p className={`text-base font-bold ${uploadResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                                        {uploadResult.success
                                            ? `Successfully inserted ${uploadResult.inserted} sites`
                                            : uploadResult.error ?? 'Upload failed'}
                                    </p>
                                </div>
                                {uploadResult.errors && uploadResult.errors.length > 0 && (
                                    <div className="mt-3 max-h-40 overflow-y-auto">
                                        <p className="text-xs font-semibold text-amber-700 mb-1">
                                            {uploadResult.errors.length} warning{uploadResult.errors.length > 1 ? 's' : ''}:
                                        </p>
                                        {uploadResult.errors.map((e, i) => (
                                            <p key={i} className="text-xs text-amber-600 ml-3">• {e}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Upload history */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="w-4 h-4 text-slate-500" />
                                <h3 className="text-base font-bold text-slate-900">Upload History</h3>
                            </div>
                            {historyLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                </div>
                            ) : uploadHistory.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    <FileUp className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                    No uploads yet. Upload your first file above.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {uploadHistory.map((u) => (
                                        <div key={u.id} className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-4 py-3">
                                            <div className={`w-2 h-2 rounded-full ${u.status === 'completed' ? 'bg-emerald-500' : u.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">{u.filename}</p>
                                                <p className="text-xs text-slate-400">{new Date(u.uploaded_at).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-bold text-slate-900">{u.records_count} sites</p>
                                                {u.errors_count > 0 && <p className="text-[10px] text-amber-600">{u.errors_count} warnings</p>}
                                            </div>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${u.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : u.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {u.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'presets' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-base font-bold text-slate-900">Saved Presets</h3>
                            <button
                                onClick={refetchPresets}
                                className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                            >
                                <RefreshCcw className="w-3 h-3" /> Refresh
                            </button>
                        </div>
                        {presetsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                            </div>
                        ) : presets.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                No presets found. Create one from the Scoring Panel.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {presets.map((p) => (
                                    <div key={p.id} className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-4 py-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                                                {p.isSystem && (
                                                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full uppercase">System</span>
                                                )}
                                            </div>
                                            {p.description && <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>}
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                by {p.createdBy} · {new Date(p.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {!p.isSystem && (
                                            <button
                                                onClick={() => deletePreset(p.id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                                title="Delete preset"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
