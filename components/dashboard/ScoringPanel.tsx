'use client';
import { useState } from 'react';
import { useWeightStore } from '@/store/weightStore';
import { usePermissions } from '@/hooks/usePermissions';
import { usePresets } from '@/hooks/usePresets';
import { DEFAULT_WEIGHTS, WeightConfig } from '@/types/scoring';
import { FACTOR_LABELS } from '@/types/site';
import { RotateCcw, Save, Loader2 } from 'lucide-react';

export default function ScoringPanel() {
    const { rawWeights, normalizedWeights, setWeight, resetToDefault, loadPreset, activePresetName, isDirty } = useWeightStore();
    const { can } = usePermissions();
    const canEdit = can('adjust_sliders');
    const { presets, createPreset, isLoading: presetsLoading } = usePresets();

    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [saving, setSaving] = useState(false);

    const factors = Object.keys(DEFAULT_WEIGHTS) as (keyof WeightConfig)[];

    const handleSavePreset = async () => {
        if (!presetName.trim()) return;
        setSaving(true);
        try {
            await createPreset(presetName.trim(), rawWeights);
            setSaveModalOpen(false);
            setPresetName('');
        } catch {
            alert('Failed to save preset');
        } finally {
            setSaving(false);
        }
    };

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
                    <button
                        onClick={() => setSaveModalOpen(true)}
                        className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Save className="w-3.5 h-3.5" /> Save as Preset
                    </button>

                    {/* Load preset dropdown */}
                    {presetsLoading ? (
                        <div className="flex items-center justify-center py-2">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        </div>
                    ) : presets.length > 0 && (
                        <select
                            onChange={(e) => {
                                const preset = presets.find((p) => p.id === e.target.value);
                                if (preset) loadPreset(preset);
                            }}
                            defaultValue=""
                            className="w-full h-9 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="" disabled>Load Preset…</option>
                            {presets.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}{p.isSystem ? ' (System)' : ''}</option>
                            ))}
                        </select>
                    )}
                </div>
            )}

            {!canEdit && (
                <div className="px-4 py-3 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400 text-center">
                        Analyst role or higher required to adjust weights
                    </p>
                </div>
            )}

            {/* Save Preset Modal */}
            {saveModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-80">
                        <h3 className="text-lg font-bold text-slate-900 mb-3">Save Preset</h3>
                        <input
                            type="text"
                            placeholder="Preset name"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            className="w-full h-10 px-4 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSavePreset}
                                disabled={saving || !presetName.trim()}
                                className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                            </button>
                            <button
                                onClick={() => { setSaveModalOpen(false); setPresetName(''); }}
                                className="flex-1 h-9 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
