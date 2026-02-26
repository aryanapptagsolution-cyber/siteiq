'use client';
import { useMemo, useState } from 'react';
import {
    useReactTable, getCoreRowModel, getSortedRowModel, flexRender,
    ColumnDef, SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { Site } from '@/types/site';
import { FACTOR_LABELS } from '@/types/site';
import { getScoreColorClass, getScoreBgClass, getBucketColorClass, getBucketLabel, getScoreBarColor } from '@/utils/scoreColor';
import { usePermissions } from '@/hooks/usePermissions';
import { WeightConfig } from '@/types/scoring';
import { computeCompositeScore } from '@/utils/normalizeWeights';
import { ArrowUpDown, Eye, Lock, Star } from 'lucide-react';
import Link from 'next/link';

interface Props {
    sites: Site[];
    normalizedWeights: WeightConfig;
}

export default function SiteTable({ sites, normalizedWeights }: Props) {
    const { can } = usePermissions();
    const [sorting, setSorting] = useState<SortingState>([{ id: 'compositeScore', desc: true }]);
    const parentRef = useRef<HTMLDivElement>(null);

    // Recompute composite scores client-side from current weights
    const recomputedSites = useMemo(() =>
        sites.map((site) => ({
            ...site,
            compositeScore: computeCompositeScore(site.factorScores as unknown as Record<string, number>, normalizedWeights),
        }))
            .sort((a, b) => b.compositeScore - a.compositeScore)
            .map((s, i) => ({ ...s, rank: i + 1 })),
        [sites, normalizedWeights]
    );

    const columns = useMemo<ColumnDef<Site>[]>(() => [
        {
            id: 'rank',
            header: 'Rank',
            size: 60,
            cell: ({ row }) => {
                const rank = row.original.rank ?? row.index + 1;
                return (
                    <div className="flex items-center justify-center">
                        {rank === 1 ? <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            : rank === 2 ? <Star className="w-4 h-4 text-slate-400 fill-slate-400" />
                                : rank === 3 ? <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
                                    : <span className="text-sm text-slate-500 font-medium">#{rank}</span>}
                    </div>
                );
            },
        },
        {
            accessorKey: 'siteId',
            header: 'Site ID',
            size: 100,
            cell: ({ getValue }) => (
                <span className="text-xs font-mono text-indigo-600">{String(getValue())}</span>
            ),
        },
        {
            accessorKey: 'address',
            header: 'Address',
            size: 220,
            cell: ({ row }) => (
                <div className="text-xs">
                    <p className="text-slate-900 font-medium truncate max-w-[200px]">{row.original.address}</p>
                    <p className="text-slate-400">{row.original.city}, {row.original.state}</p>
                </div>
            ),
        },
        {
            accessorKey: 'compositeScore',
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-700"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Score <ArrowUpDown className="w-3 h-3" />
                </button>
            ),
            size: 90,
            cell: ({ getValue }) => {
                const score = Number(getValue());
                return (
                    <span className={`text-lg font-bold ${getScoreColorClass(score)}`}>
                        {score.toFixed(1)}
                    </span>
                );
            },
        },
        {
            id: 'factorBars',
            header: 'Factors',
            size: 160,
            cell: ({ row }) => {
                const scores = row.original.factorScores;
                return (
                    <div className="space-y-0.5">
                        {(Object.entries(scores) as [keyof typeof FACTOR_LABELS, number][]).slice(0, 5).map(([k, v]) => (
                            <div key={k} className="flex items-center gap-1.5">
                                <span className="text-[9px] text-slate-400 w-14 truncate">{FACTOR_LABELS[k]}</span>
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: getScoreBarColor(v) }} />
                                </div>
                                <span className="text-[9px] text-slate-500 w-5 text-right">{Math.round(v)}</span>
                            </div>
                        ))}
                    </div>
                );
            },
        },
        {
            accessorKey: 'bucket',
            header: 'Bucket',
            size: 100,
            cell: ({ getValue }) => {
                const b = getValue() as Site['bucket'];
                return (
                    <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${getBucketColorClass(b)}`}>
                        {getBucketLabel(b)}
                    </span>
                );
            },
        },
        {
            accessorKey: 'dataQualityGrade',
            header: 'Quality',
            size: 70,
            cell: ({ getValue }) => {
                const g = String(getValue());
                const color = g === 'A' ? 'bg-emerald-100 text-emerald-700' : g === 'B' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700';
                return (
                    <span className={`text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center ${color}`}>
                        {g}
                    </span>
                );
            },
        },
        {
            id: 'owner',
            header: 'Owner',
            size: 120,
            cell: ({ row }) => {
                if (!can('view_pii')) {
                    return (
                        <div className="flex items-center gap-1 text-slate-400">
                            <Lock className="w-3 h-3" />
                            <span className="text-xs">••••••</span>
                        </div>
                    );
                }
                return (
                    <span className="text-xs text-slate-600 truncate max-w-[100px] block">
                        {row.original.owner?.name ?? '—'}
                    </span>
                );
            },
        },
        {
            id: 'actions',
            header: '',
            size: 80,
            cell: ({ row }) => (
                <Link
                    href={`/site/${row.original.id}`}
                    className="flex items-center gap-1 text-xs text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors font-medium"
                >
                    <Eye className="w-3 h-3" /> View
                </Link>
            ),
        },
    ], [can, normalizedWeights]);

    const table = useReactTable({
        data: recomputedSites,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: false,
    });

    const rows = table.getRowModel().rows;

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 56,
        overscan: 10,
    });

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Table header */}
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500">Showing {rows.length} sites</span>
                <div className="flex-1" />
                <span className="text-xs text-slate-400">Top 10 highlighted</span>
            </div>

            {/* Column headers */}
            <div className="border-b border-slate-100 shrink-0 overflow-x-auto">
                {table.getHeaderGroups().map((hg) => (
                    <div key={hg.id} className="flex" style={{ minWidth: 900 }}>
                        {hg.headers.map((header) => (
                            <div
                                key={header.id}
                                className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 bg-slate-50"
                                style={{ width: header.getSize(), minWidth: header.getSize() }}
                            >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Virtualised rows */}
            <div ref={parentRef} className="flex-1 overflow-auto">
                <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative', minWidth: 900 }}>
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const row = rows[virtualRow.index];
                        const rank = (row.original.rank ?? virtualRow.index + 1);
                        const isTop10 = rank <= 10;
                        const isTop1 = rank === 1;
                        return (
                            <div
                                key={row.id}
                                className={`site-row flex absolute top-0 left-0 w-full border-b border-slate-50 hover:bg-slate-50 transition-colors ${isTop1 ? 'bg-indigo-50' : ''}`}
                                style={{
                                    transform: `translateY(${virtualRow.start}px)`,
                                    height: virtualRow.size,
                                    borderLeft: isTop10 ? '3px solid #6366f1' : '3px solid transparent',
                                }}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <div
                                        key={cell.id}
                                        className="px-3 flex items-center"
                                        style={{ width: cell.column.getSize(), minWidth: cell.column.getSize() }}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
