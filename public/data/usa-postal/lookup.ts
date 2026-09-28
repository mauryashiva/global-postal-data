/**
 * Enterprise Local United States ZIP Code & Address Lookup Engine
 * ================================================================
 * Location: data/usa-postal/lookup.ts & public/data/usa-postal/lookup.ts
 *
 * 100% Offline & Local - Zero Runtime External API Calls.
 * Supports dual-environment execution: Browser (static asset fetch) & Node.js (fs).
 *
 * Implements:
 * - 5-Digit Standard ZIP Validation (^[0-9]{5}$)
 * - ZIP+4 Extended Format Validation (^[0-9]{5}-[0-9]{4}$)
 * - 50 States (states/), District of Columbia (district-of-columbia/), 5 Territories (territories/), Military (military/)
 * - O(1) ZIP & Prefix-Based Partition Routing
 * - Microsecond-Level Local In-Memory Caching (< 0.1ms)
 * - Multiple Postal City Name Associations (Primary vs Acceptable)
 * - Multi-County Boundaries and FIPS Crosswalks
 * - ZCTA Distinct Identification (ZIP != ZCTA)
 * - Representative Centroid Coordinates
 * - Strict String Leading Zero Preservation (e.g. 00501, 01001, 02108, 07001)
 */

export interface UsaCountyInfo {
  name: string;
  fipsCode: string;
  geoid: string;
}

export interface UsaPostalCityInfo {
  name: string;
  status: 'Primary' | 'Acceptable';
}

export interface UsaPostOfficeInfo {
  name: string;
  address?: string;
  phone?: string;
  type?: string;
}

export interface UsaMilitaryOfficeInfo {
  code: string;
  region: string;
  baseName: string;
  postalGateway: string;
}

export interface UsaPostalRecord {
  id: string;
  zip5: string;
  zip4?: string | null;
  zipPlus4?: string | null;
  state: {
    nameEn: string;
    abbreviation: string;
    fipsCode: string;
    administrativeType: string;
    category: string;
  };
  primaryCity: string;
  acceptableCities: string[];
  postalCityNames: UsaPostalCityInfo[];
  counties: UsaCountyInfo[];
  primaryCounty?: string | null;
  zcta?: { code: string } | null;
  zipType: 'STANDARD' | 'PO BOX' | 'UNIQUE' | 'MILITARY';
  militaryOffice?: UsaMilitaryOfficeInfo | null;
  postOffice?: UsaPostOfficeInfo | null;
  coordinates?: {
    latitude: number;
    longitude: number;
    type: string;
  } | null;
  telephone: {
    countryCode: string;
    areaCodes: string[];
  };
  deliveryInfo?: {
    carrierRoutes: number;
    deliveryPoints: number;
  } | null;
  source: {
    name: string;
    url: string;
    recordId: string;
    sourceUpdatedAt: string;
    retrievedAt: string;
  };
}

export interface UsaDivisionInfo {
  nameEn: string;
  abbreviation: string;
  fipsCode: string;
  capital: string;
  largestCity: string;
  category: string;
  administrativeType: string;
  areaCodes: string[];
  prefixes: string[];
}

export interface UsaDivisionDataset {
  country: string;
  countryOfficialEn: string;
  division: UsaDivisionInfo;
  statistics: {
    uniqueZip5: number;
    uniqueZipPlus4: number;
    totalRecords: number;
    countiesCount: number;
  };
  records: UsaPostalRecord[];
}

export interface UsaDivisionSummary {
  division: string;
  abbreviation: string;
  fipsCode: string;
  category: string;
  administrativeType: string;
  capital: string;
  uniqueZip5: number;
  uniqueZipPlus4: number;
  totalRecords: number;
  file: string;
}

export interface UsaPostalIndex {
  country: {
    nameEn: string;
    nameOfficialEn: string;
    nameNative: string;
    isoAlpha2: string;
    isoAlpha3: string;
    isoNumeric: string;
    phoneCode: string;
    flag: string;
  };
  postalSystem: {
    name: string;
    zip5Length: number;
    zip5Format: string;
    zip5Regex: string;
    zipPlus4Format: string;
    zipPlus4Regex: string;
    structure: Record<string, string>;
  };
  administrativeSummary: {
    stateCount: number;
    districtCount: number;
    territoryCount: number;
    militaryCount: number;
    totalJurisdictions: number;
    divisions: UsaDivisionSummary[];
  };
  statistics: {
    uniqueZip5: number;
    uniqueZipPlus4: number;
    totalRecords: number;
    totalCountiesCovered: number;
    totalPostOffices: number;
  };
  zipToPartition: Record<string, { slug: string; category: string; file: string }>;
  prefixToPartition: Record<string, { slug: string; category: string; file: string }>;
  sources: Array<{
    name: string;
    url?: string;
    system?: string;
    sourceUpdatedAt?: string;
    retrievedAt?: string;
  }>;
  lastUpdated: string;
}

export interface UsaLookupResult {
  found: boolean;
  postalCode: string;
  zip5: string;
  zip4?: string | null;
  zipPlus4?: string | null;
  executionTimeMs: number;
  division?: UsaDivisionInfo;
  records: UsaPostalRecord[];
  cityNames: string[];
  defaultCity?: string;
  counties: string[];
  defaultCounty?: string;
  error?: string;
}

// In-Memory Module Caches for microsecond lookups (< 0.1ms)
let cachedIndex: UsaPostalIndex | null = null;
const cachedDivisions: Map<string, UsaDivisionDataset> = new Map();

/**
 * Universal JSON file loader supporting Node.js (filesystem) and Browser (fetch)
 */
async function loadUsJson<T>(relativePath: string): Promise<T> {
  if (typeof window === 'undefined') {
    const fs = await import('fs/promises');
    const path = await import('path');

    const candidatePaths = [
      path.join(process.cwd(), 'data', 'usa-postal', relativePath),
      path.join(process.cwd(), 'public', 'data', 'usa-postal', relativePath),
    ];

    for (const p of candidatePaths) {
      try {
        const raw = await fs.readFile(/*turbopackIgnore: true*/ p, 'utf8');
        return JSON.parse(raw) as T;
      } catch {
        // try next candidate
      }
    }
    throw new Error(`Local United States postal file not found: ${relativePath}`);
  } else {
    const url = `/data/usa-postal/${relativePath}`;
    const response = await fetch(url, {
      cache: 'force-cache',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to load local United States postal file: ${url} (status: ${response.status})`);
    }
    return (await response.json()) as T;
  }
}

/**
 * Retrieves the master United States postal index
 */
export async function getUsaIndex(): Promise<UsaPostalIndex> {
  if (cachedIndex) return cachedIndex;
  cachedIndex = await loadUsJson<UsaPostalIndex>('index.json');
  return cachedIndex;
}

/**
 * Validates a United States ZIP Code (standard 5-digit or ZIP+4)
 */
export function validateUsaPostalCode(code: string): {
  valid: boolean;
  isZipPlus4: boolean;
  zip5?: string;
  zip4?: string;
  clean?: string;
  error?: string;
} {
  if (!code || typeof code !== 'string') {
    return { valid: false, isZipPlus4: false, error: 'ZIP Code must be a non-empty string' };
  }

  const clean = code.trim();

  // Standard 5-digit ZIP
  if (/^[0-9]{5}$/.test(clean)) {
    return { valid: true, isZipPlus4: false, zip5: clean, clean };
  }

  // Standard ZIP+4 with hyphen: 12345-6789
  if (/^[0-9]{5}-[0-9]{4}$/.test(clean)) {
    const [zip5, zip4] = clean.split('-');
    return { valid: true, isZipPlus4: true, zip5, zip4, clean };
  }

  // 9-digit numeric without hyphen: 123456789
  if (/^[0-9]{9}$/.test(clean)) {
    const zip5 = clean.slice(0, 5);
    const zip4 = clean.slice(5);
    return { valid: true, isZipPlus4: true, zip5, zip4, clean: `${zip5}-${zip4}` };
  }

  if (clean.length < 5) {
    return { valid: false, isZipPlus4: false, error: `U.S. ZIP Codes require at least 5 digits (received ${clean.length})` };
  }

  return {
    valid: false,
    isZipPlus4: false,
    error: 'Invalid U.S. ZIP Code format. Expected 5 digits (#####) or ZIP+4 (#####-####)',
  };
}

/**
 * Performs a 100% offline, local ZIP code lookup for the United States
 */
export async function lookupUsaPostalCode(rawCode: string): Promise<UsaLookupResult> {
  const startTime = performance.now();
  const rawClean = (rawCode || '').trim();

  const validation = validateUsaPostalCode(rawClean);
  if (!validation.valid || !validation.zip5) {
    return {
      found: false,
      postalCode: rawClean,
      zip5: rawClean.slice(0, 5),
      executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      records: [],
      cityNames: [],
      counties: [],
      error: validation.error,
    };
  }

  const zip5 = validation.zip5;
  const zip4 = validation.zip4 || null;
  const targetZipPlus4 = validation.isZipPlus4 ? validation.clean : null;
  const prefix3 = zip5.slice(0, 3);

  try {
    const index = await getUsaIndex();

    // 1. Direct O(1) ZIP5 lookup in master index
    let partitionTarget = index.zipToPartition ? index.zipToPartition[zip5] : null;

    // 2. Prefix-based partition resolution fallback
    if (!partitionTarget && index.prefixToPartition) {
      partitionTarget = index.prefixToPartition[prefix3];
    }

    if (partitionTarget && partitionTarget.file) {
      let divData = cachedDivisions.get(partitionTarget.file);
      if (!divData) {
        divData = await loadUsJson<UsaDivisionDataset>(partitionTarget.file);
        cachedDivisions.set(partitionTarget.file, divData);
      }

      // Filter matching records by zip5
      let matchingRecords = divData.records.filter((r) => r.zip5 === zip5);

      // If user provided a specific ZIP+4, prioritize exact match if available
      if (targetZipPlus4 && matchingRecords.length > 0) {
        const exactPlus4Match = matchingRecords.filter((r) => r.zipPlus4 === targetZipPlus4);
        if (exactPlus4Match.length > 0) {
          matchingRecords = exactPlus4Match;
        }
      }

      if (matchingRecords.length > 0) {
        // Collect distinct city names and counties
        const allCities: string[] = [];
        const allCounties: string[] = [];

        for (const r of matchingRecords) {
          if (r.primaryCity && !allCities.includes(r.primaryCity)) {
            allCities.push(r.primaryCity);
          }
          if (Array.isArray(r.acceptableCities)) {
            for (const c of r.acceptableCities) {
              if (c && !allCities.includes(c)) allCities.push(c);
            }
          }
          if (Array.isArray(r.counties)) {
            for (const county of r.counties) {
              if (county.name && !allCounties.includes(county.name)) {
                allCounties.push(county.name);
              }
            }
          }
        }

        const defaultCity = matchingRecords[0].primaryCity || allCities[0] || divData.division.capital;
        const defaultCounty = matchingRecords[0].primaryCounty || allCounties[0] || null;
        const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

        return {
          found: true,
          postalCode: targetZipPlus4 || zip5,
          zip5,
          zip4,
          zipPlus4: targetZipPlus4,
          executionTimeMs: Math.max(0.01, executionTimeMs),
          division: divData.division,
          records: matchingRecords,
          cityNames: allCities,
          defaultCity,
          counties: allCounties,
          defaultCounty: defaultCounty || undefined,
        };
      }
    }

    // 3. Fallback: Search all 57 partitions
    for (const divSummary of index.administrativeSummary.divisions) {
      if (partitionTarget && divSummary.file === partitionTarget.file) continue;

      let divData = cachedDivisions.get(divSummary.file);
      if (!divData) {
        try {
          divData = await loadUsJson<UsaDivisionDataset>(divSummary.file);
          cachedDivisions.set(divSummary.file, divData);
        } catch {
          continue;
        }
      }

      let matchingRecords = divData.records.filter((r) => r.zip5 === zip5);
      if (matchingRecords.length > 0) {
        if (targetZipPlus4) {
          const exactPlus4Match = matchingRecords.filter((r) => r.zipPlus4 === targetZipPlus4);
          if (exactPlus4Match.length > 0) {
            matchingRecords = exactPlus4Match;
          }
        }

        const allCities: string[] = [];
        const allCounties: string[] = [];

        for (const r of matchingRecords) {
          if (r.primaryCity && !allCities.includes(r.primaryCity)) {
            allCities.push(r.primaryCity);
          }
          if (Array.isArray(r.acceptableCities)) {
            for (const c of r.acceptableCities) {
              if (c && !allCities.includes(c)) allCities.push(c);
            }
          }
          if (Array.isArray(r.counties)) {
            for (const county of r.counties) {
              if (county.name && !allCounties.includes(county.name)) {
                allCounties.push(county.name);
              }
            }
          }
        }

        const defaultCity = matchingRecords[0].primaryCity || allCities[0] || divData.division.capital;
        const defaultCounty = matchingRecords[0].primaryCounty || allCounties[0] || null;
        const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

        return {
          found: true,
          postalCode: targetZipPlus4 || zip5,
          zip5,
          zip4,
          zipPlus4: targetZipPlus4,
          executionTimeMs: Math.max(0.01, executionTimeMs),
          division: divData.division,
          records: matchingRecords,
          cityNames: allCities,
          defaultCity,
          counties: allCounties,
          defaultCounty: defaultCounty || undefined,
        };
      }
    }

    // ZIP not found in local dataset
    return {
      found: false,
      postalCode: rawClean,
      zip5,
      zip4,
      zipPlus4: targetZipPlus4,
      executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      records: [],
      cityNames: [],
      counties: [],
      error: `ZIP Code ${rawClean} not found in local United States postal dataset.`,
    };
  } catch (err: any) {
    return {
      found: false,
      postalCode: rawClean,
      zip5,
      executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      records: [],
      cityNames: [],
      counties: [],
      error: `Local United States postal lookup failed: ${err.message || String(err)}`,
    };
  }
}

/**
 * Clears the in-memory cache
 */
export function clearUsaPostalCache(): void {
  cachedIndex = null;
  cachedDivisions.clear();
}
