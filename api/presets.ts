import { apiClient } from './client';
import { Preset, WeightConfig } from '@/types/scoring';

export const presetsApi = {
    getAll: () =>
        apiClient.get<Preset[]>('/presets').then((r) => r.data),

    create: (name: string, weights: WeightConfig, description?: string) =>
        apiClient.post<Preset>('/presets', { name, weights, description }).then((r) => r.data),

    update: (id: string, data: Partial<Preset>) =>
        apiClient.put<Preset>(`/presets/${id}`, data).then((r) => r.data),

    delete: (id: string) =>
        apiClient.delete(`/presets/${id}`),
};
