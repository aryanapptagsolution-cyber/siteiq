import { apiClient } from './client';
import { SiteListResponse, Site } from '@/types/site';
import { WeightConfig } from '@/types/scoring';

export interface GetSitesParams {
    metro?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    buckets?: string[];
    qualityGrades?: string[];
    weights?: WeightConfig;
}

export const sitesApi = {
    getAll: (params: GetSitesParams) =>
        apiClient.get<SiteListResponse>('/sites', { params }).then((r) => r.data),

    getById: (id: string) =>
        apiClient.get<Site>(`/sites/${id}`).then((r) => r.data),

    exportCsv: (params: GetSitesParams) =>
        apiClient.get('/export/csv', { params, responseType: 'blob' }).then((r) => r.data),

    exportPdf: (siteId: string) =>
        apiClient.post(`/export/site/${siteId}`, {}, { responseType: 'blob' }).then((r) => r.data),
};
