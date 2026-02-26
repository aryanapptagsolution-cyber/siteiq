import { apiClient } from './client';
import { AuditListResponse } from '@/types/audit';

export interface IngestionJobStatus {
    jobId: string;
    status: 'queued' | 'running' | 'completed' | 'failed';
    progress: number;
    recordsProcessed: number;
    errors: number;
    startedAt: string;
    completedAt?: string;
    logs: string[];
}

export const ingestionApi = {
    run: (params: { source?: string; metro?: string }) =>
        apiClient.post<{ jobId: string }>('/ingestion/run', params).then((r) => r.data),

    getJob: (jobId: string) =>
        apiClient.get<IngestionJobStatus>(`/ingestion/job/${jobId}`).then((r) => r.data),
};

export const auditApi = {
    getAll: (params: {
        page?: number;
        pageSize?: number;
        action?: string;
        userId?: string;
        from?: string;
        to?: string;
    }) =>
        apiClient.get<AuditListResponse>('/audit', { params }).then((r) => r.data),
};
