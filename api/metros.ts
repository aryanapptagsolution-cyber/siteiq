import { apiClient } from './client';
import { Metro } from '@/store/metroStore';

export const metrosApi = {
    search: (query: string) =>
        apiClient.get<Metro[]>('/metros', { params: { q: query } }).then((r) => r.data),

    getAll: () =>
        apiClient.get<Metro[]>('/metros').then((r) => r.data),
};
