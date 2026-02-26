import { WeightConfig } from '@/types/scoring';

/**
 * Normalizes weights so they always sum to 100.
 * If total is 0, distributes equally.
 */
export function normalizeWeights(weights: WeightConfig): WeightConfig {
    const keys = Object.keys(weights) as (keyof WeightConfig)[];
    const total = keys.reduce((sum, k) => sum + weights[k], 0);

    if (total === 0) {
        const equal = 100 / keys.length;
        return Object.fromEntries(keys.map((k) => [k, equal])) as WeightConfig;
    }

    const normalized = Object.fromEntries(
        keys.map((k) => [k, (weights[k] / total) * 100])
    ) as WeightConfig;

    return normalized;
}

/**
 * Computes composite score for a site given its factor scores and normalized weights.
 * compositeScore = sum(factorScore_i * normalizedWeight_i / 100)
 */
export function computeCompositeScore(
    factorScores: Record<string, number>,
    normalizedWeights: WeightConfig
): number {
    const keys = Object.keys(normalizedWeights) as (keyof WeightConfig)[];
    const score = keys.reduce((sum, k) => {
        return sum + (factorScores[k] ?? 0) * (normalizedWeights[k] / 100);
    }, 0);
    return Math.round(score * 10) / 10;
}
