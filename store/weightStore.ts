import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WeightConfig, DEFAULT_WEIGHTS, Preset } from '@/types/scoring';
import { normalizeWeights } from '@/utils/normalizeWeights';

interface WeightState {
    rawWeights: WeightConfig;
    normalizedWeights: WeightConfig;
    activePresetId: string | null;
    activePresetName: string;
    isDirty: boolean;
    setWeight: (factor: keyof WeightConfig, value: number) => void;
    resetToDefault: () => void;
    loadPreset: (preset: Preset) => void;
    getRawWeights: () => WeightConfig;
}

export const useWeightStore = create<WeightState>()(
    persist(
        (set, get) => ({
            rawWeights: DEFAULT_WEIGHTS,
            normalizedWeights: DEFAULT_WEIGHTS,
            activePresetId: null,
            activePresetName: 'Default',
            isDirty: false,
            setWeight: (factor, value) => {
                const updated = { ...get().rawWeights, [factor]: Math.max(0, Math.min(100, value)) };
                set({
                    rawWeights: updated,
                    normalizedWeights: normalizeWeights(updated),
                    isDirty: true,
                });
            },
            resetToDefault: () =>
                set({
                    rawWeights: DEFAULT_WEIGHTS,
                    normalizedWeights: DEFAULT_WEIGHTS,
                    activePresetId: null,
                    activePresetName: 'Default',
                    isDirty: false,
                }),
            loadPreset: (preset) =>
                set({
                    rawWeights: preset.weights,
                    normalizedWeights: normalizeWeights(preset.weights),
                    activePresetId: preset.id,
                    activePresetName: preset.name,
                    isDirty: false,
                }),
            getRawWeights: () => get().rawWeights,
        }),
        { name: 'siteiq-weights' }
    )
);
