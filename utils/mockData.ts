import { Site, Bucket, DataQualityGrade, FactorScores } from '@/types/site';

const ADDRESSES = [
    '2847 Sunset Blvd', '1200 Wilshire Blvd', '5400 Hollywood Blvd', '900 N Vermont Ave',
    '3500 W Century Blvd', '12100 Wilshire Blvd', '600 S Spring St', '1 World Way',
    '8500 Beverly Blvd', '4200 Lankershim Blvd', '333 S Hope St', '7000 Santa Monica Blvd',
    '2100 E Imperial Hwy', '5700 Arbor Vitae St', '1 Staples Center Dr', '777 S Figueroa St',
    '3030 Andrita St', '11300 W Olympic Blvd', '9255 Sunset Blvd', '2600 Sepulveda Blvd',
];

const BUCKETS: Bucket[] = ['immediate', 'immediate', 'near-term', 'near-term', 'long-term', 'gated'];
const GRADES: DataQualityGrade[] = ['A', 'A', 'B', 'B', 'C'];

function randFloat(min: number, max: number) {
    return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}
function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateFactorScores(): FactorScores {
    return {
        evScore: randFloat(20, 100),
        population: randFloat(20, 100),
        evOwnership: randFloat(10, 100),
        evUsageDemand: randFloat(15, 100),
        streetTraffic: randFloat(10, 100),
        income: randFloat(10, 100),
        proximityAmenities: randFloat(20, 100),
        footTraffic: randFloat(15, 100),
        mallOccupancy: randFloat(0, 100),
        retailers: randFloat(0, 100),
    };
}

// Generate 200 mock sites centered around LA
export function generateMockSites(count = 200): Site[] {
    const sites: Site[] = [];
    const baseLat = 34.0522;
    const baseLng = -118.2437;

    for (let i = 0; i < count; i++) {
        const factorScores = generateFactorScores();
        const compositeScore = randFloat(25, 98);
        const bucket: Bucket =
            compositeScore >= 75 ? 'immediate'
                : compositeScore >= 55 ? 'near-term'
                    : compositeScore >= 35 ? 'long-term'
                        : 'gated';

        const site: Site = {
            id: `site-${i + 1}`,
            siteId: `LA-${String(i + 1).padStart(4, '0')}`,
            address: `${randInt(100, 9999)} ${pickRandom(ADDRESSES)}`,
            city: 'Los Angeles',
            state: 'CA',
            metro: 'Los Angeles, CA',
            lat: baseLat + (Math.random() - 0.5) * 0.8,
            lng: baseLng + (Math.random() - 0.5) * 1.2,
            compositeScore,
            factorScores,
            bucket,
            dataQualityGrade: pickRandom(GRADES),
            missingFields: Math.random() > 0.7
                ? ['Mall Foot Traffic Score', 'Charging Demand Index'].slice(0, randInt(1, 2))
                : [],
            utilityFlag: Math.random() > 0.7,
            utilityInfo: {
                provider: 'Southern California Edison',
                gridCapacityPct: randInt(20, 95),
                interconnectionQueueMonths: randInt(1, 12),
                permitStatus: pickRandom(['approved', 'pending', 'denied'] as const),
                flagged: Math.random() > 0.7,
            },
            owner: {
                name: 'Property Holdings LLC',
                email: 'owner@example.com',
                phone: `+1 (${randInt(200, 999)}) ${randInt(200, 999)}-${randInt(1000, 9999)}`,
                propertyType: pickRandom(['Commercial', 'Mixed-Use', 'Retail', 'Industrial']),
                parcelId: `2345-${randInt(100, 999)}-${randInt(10, 99)}`,
                leaseStatus: pickRandom(['available', 'restricted', 'unavailable'] as const),
            },
            dataSources: [
                { name: 'Google Maps', status: 'synced', lastSynced: '2026-02-24' },
                { name: 'Census Bureau', status: 'synced', lastSynced: '2026-02-23' },
                { name: 'Utility API', status: Math.random() > 0.8 ? 'warning' : 'synced', lastSynced: '2026-02-22' },
            ],
            photos: [],
            notes: '',
            scoreTimestamp: '2026-02-25T09:42:00Z',
            rank: i + 1,
        };
        sites.push(site);
    }

    return sites.sort((a, b) => b.compositeScore - a.compositeScore).map((s, i) => ({ ...s, rank: i + 1 }));
}

export const MOCK_SITES = generateMockSites(200);
