export type AuditActionType =
    | 'weight_change'
    | 'preset_loaded'
    | 'preset_created'
    | 'preset_deleted'
    | 'ingestion_run'
    | 'csv_export'
    | 'pdf_export'
    | 'site_view'
    | 'login_success'
    | 'login_failed'
    | 'rollback'
    | 'file_upload';

export const ACTION_LABELS: Record<AuditActionType, string> = {
    weight_change: 'Weight Change',
    preset_loaded: 'Preset Loaded',
    preset_created: 'Preset Created',
    preset_deleted: 'Preset Deleted',
    ingestion_run: 'Ingestion Run',
    csv_export: 'CSV Export',
    pdf_export: 'PDF Export',
    site_view: 'Site View',
    login_success: 'Login',
    login_failed: 'Login Failed',
    rollback: 'Rollback',
    file_upload: 'File Upload',
};

export const ACTION_COLORS: Record<AuditActionType, string> = {
    weight_change: 'bg-indigo-100 text-indigo-700',
    preset_loaded: 'bg-blue-100 text-blue-700',
    preset_created: 'bg-blue-100 text-blue-700',
    preset_deleted: 'bg-red-100 text-red-700',
    ingestion_run: 'bg-amber-100 text-amber-700',
    csv_export: 'bg-emerald-100 text-emerald-700',
    pdf_export: 'bg-emerald-100 text-emerald-700',
    site_view: 'bg-slate-100 text-slate-700',
    login_success: 'bg-slate-100 text-slate-700',
    login_failed: 'bg-red-100 text-red-700',
    rollback: 'bg-orange-100 text-orange-700',
    file_upload: 'bg-purple-100 text-purple-700',
};

export interface AuditEvent {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    userRole: string;
    action: AuditActionType;
    details: string;
    before?: string;
    after?: string;
    ipAddress?: string;
    status: 'success' | 'failed';
}

export interface AuditListResponse {
    events: AuditEvent[];
    total: number;
    page: number;
    pageSize: number;
}
