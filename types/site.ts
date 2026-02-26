export type Bucket = 'immediate' | 'near-term' | 'long-term' | 'gated';
export type DataQualityGrade = 'A' | 'B' | 'C';

export interface FactorScores {
    evScore: number;
    population: number;
    evOwnership: number;
    evUsageDemand: number;
    streetTraffic: number;
    income: number;
    proximityAmenities: number;
    footTraffic: number;
    mallOccupancy: number;
    retailers: number;
}

export const FACTOR_LABELS: Record<keyof FactorScores, string> = {
    evScore: 'EV Score',
    population: 'Population',
    evOwnership: 'EV Ownership',
    evUsageDemand: 'EV Usage / Demand',
    streetTraffic: 'Street Traffic',
    income: 'Income',
    proximityAmenities: 'Proximity to Amenities',
    footTraffic: 'Foot Traffic',
    mallOccupancy: 'Mall Occupancy',
    retailers: 'Retailers / Thoroughfare',
};

export interface SiteOwner {
    name: string;
    email: string;
    phone: string;
    propertyType: string;
    parcelId: string;
    leaseStatus: 'available' | 'restricted' | 'unavailable';
}

export interface UtilityInfo {
    provider: string;
    gridCapacityPct: number;
    interconnectionQueueMonths: number;
    permitStatus: 'approved' | 'pending' | 'denied';
    flagged: boolean;
}

export interface DataSource {
    name: string;
    status: 'synced' | 'warning' | 'error';
    lastSynced: string;
}

export interface Site {
    id: string;
    siteId: string;
    address: string;
    city: string;
    state: string;
    metro: string;
    lat: number;
    lng: number;
    compositeScore: number;
    factorScores: FactorScores;
    bucket: Bucket;
    dataQualityGrade: DataQualityGrade;
    missingFields: string[];
    utilityFlag: boolean;
    utilityInfo?: UtilityInfo;
    owner?: SiteOwner;
    dataSources: DataSource[];
    photos: string[];
    notes: string;
    scoreTimestamp: string;
    rank?: number;
}

export interface SiteListResponse {
    sites: Site[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
