import { FactorScores } from './site';

export type WeightConfig = Record<keyof FactorScores, number>;

export const DEFAULT_WEIGHTS: WeightConfig = {
    evScore: 25,
    population: 15,
    evOwnership: 12,
    evUsageDemand: 10,
    streetTraffic: 8,
    income: 8,
    proximityAmenities: 7,
    footTraffic: 7,
    mallOccupancy: 5,
    retailers: 3,
};

export interface Preset {
    id: string;
    name: string;
    weights: WeightConfig;
    createdBy: string;
    createdAt: string;
    isSystem: boolean;
    description?: string;
}

export interface ScoreScenarioRequest {
    metro: string;
    weights: WeightConfig;
    page?: number;
    pageSize?: number;
}
