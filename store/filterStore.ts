import { create } from 'zustand';
import { Bucket, DataQualityGrade } from '@/types/site';

interface FilterState {
    buckets: Bucket[];
    qualityGrades: DataQualityGrade[];
    searchQuery: string;
    viewportFilter: boolean;
    showGated: boolean;
    page: number;
    pageSize: number;
    sortBy: string;
    sortDir: 'asc' | 'desc';
    setBucketFilter: (buckets: Bucket[]) => void;
    setQualityFilter: (grades: DataQualityGrade[]) => void;
    setSearchQuery: (q: string) => void;
    toggleViewportFilter: () => void;
    toggleShowGated: () => void;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setSortBy: (col: string, dir: 'asc' | 'desc') => void;
    resetFilters: () => void;
}

const DEFAULTS = {
    buckets: [] as Bucket[],
    qualityGrades: [] as DataQualityGrade[],
    searchQuery: '',
    viewportFilter: false,
    showGated: false,
    page: 1,
    pageSize: 50,
    sortBy: 'compositeScore',
    sortDir: 'desc' as const,
};

export const useFilterStore = create<FilterState>((set) => ({
    ...DEFAULTS,
    setBucketFilter: (buckets) => set({ buckets, page: 1 }),
    setQualityFilter: (grades) => set({ qualityGrades: grades, page: 1 }),
    setSearchQuery: (searchQuery) => set({ searchQuery, page: 1 }),
    toggleViewportFilter: () => set((s) => ({ viewportFilter: !s.viewportFilter })),
    toggleShowGated: () => set((s) => ({ showGated: !s.showGated })),
    setPage: (page) => set({ page }),
    setPageSize: (pageSize) => set({ pageSize, page: 1 }),
    setSortBy: (col, dir) => set({ sortBy: col, sortDir: dir, page: 1 }),
    resetFilters: () => set(DEFAULTS),
}));
