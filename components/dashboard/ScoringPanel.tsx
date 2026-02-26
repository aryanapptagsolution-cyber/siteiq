'use client';
import { useWeightStore } from '@/store/weightStore';
import { usePermissions } from '@/hooks/usePermissions';
import { DEFAULT_WEIGHTS, WeightConfig } from '@/types/scoring';
import { FACTOR_LABELS } from '@/types/site';
import { RotateCcw } from 'lucide-react';

export default function ScoringPanel() {
    const { rawWeights, normalizedWeights, setWeight, resetToDefault, activePresetName, isDirty } = useWeightStore();
    const { can } = usePermissions();
    const canEdit = can('adjust_sliders');

    const factors = Object.keys(DEFAULT_WEIGHTS) as (keyof WeightConfig)[];

    return (
        <div className="h-full flex flex-col bg-white border-r border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">Scoring Weights</h2>
                    {isDirty && (
                        <button
                            onClick={resetToDefault}
                            className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" /> Reset all
                        </button>
                    )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                    Preset: <span className="font-medium text-indigo-600">{activePresetName}</span>
                    {isDirty && <span className="ml-1 text-amber-500">• modified</span>}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">
                    Auto-normalize to 100%
                </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                {factors.map((factor) => {
                    const raw = rawWeights[factor];
                    const norm = normalizedWeights[factor];
                    return (
                        <div key={factor} className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] font-medium text-slate-800">{FACTOR_LABELS[factor]}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-indigo-600 min-w-[36px] text-right">
                                        {norm.toFixed(1)}%
                                    </span>
                                    <button
                                        onClick={() => setWeight(factor, DEFAULT_WEIGHTS[factor])}
                                        disabled={!canEdit}
                                        className="text-slate-300 hover:text-slate-500 disabled:opacity-30 transition-colors"
                                        title="Reset to default"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={raw}
                                    disabled={!canEdit}
                                    onChange={(e) => setWeight(factor, Number(e.target.value))}
                                    className="flex-1 disabled:opacity-40"
                                    aria-label={`${FACTOR_LABELS[factor]} weight`}
                                />
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={raw}
                                    disabled={!canEdit}
                                    onChange={(e) => setWeight(factor, Number(e.target.value))}
                                    className="w-12 text-center text-xs border border-slate-200 rounded-md py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:opacity-50"
                                    aria-label={`${FACTOR_LABELS[factor]} raw weight`}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {canEdit && (
                <div className="px-4 py-3 border-t border-slate-100 space-y-2">
                    <button className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
                        Save as Preset
                    </button>
                    <button className="w-full h-9 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm rounded-lg transition-colors">
                        Load Preset
                    </button>
                </div>
            )}

            {!canEdit && (
                <div className="px-4 py-3 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400 text-center">
                        Analyst role or higher required to adjust weights
                    </p>
                </div>
            )}
        </div>
    );
}
