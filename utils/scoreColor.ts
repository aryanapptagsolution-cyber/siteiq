/**
 * Returns the Tailwind color classes for a composite score value.
 */
export function getScoreColorClass(score: number): string {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
}

export function getScoreBarColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
}

import { Bucket } from '@/types/site';

export function getBucketColorClass(bucket: Bucket): string {
    switch (bucket) {
        case 'immediate': return 'bg-emerald-100 text-emerald-700';
        case 'near-term': return 'bg-amber-100 text-amber-700';
        case 'long-term': return 'bg-slate-100 text-slate-600';
        case 'gated': return 'bg-gray-800 text-gray-200';
    }
}

export function getBucketLabel(bucket: Bucket): string {
    switch (bucket) {
        case 'immediate': return 'Immediate';
        case 'near-term': return 'Near-Term';
        case 'long-term': return 'Long-Term';
        case 'gated': return 'Gated';
    }
}

export function getBucketMapColor(bucket: Bucket): string {
    switch (bucket) {
        case 'immediate': return '#10b981';
        case 'near-term': return '#f59e0b';
        case 'long-term': return '#94a3b8';
        case 'gated': return '#374151';
    }
}
