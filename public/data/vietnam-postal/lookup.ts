/**
 * Vietnam Postal Code & Administrative Local Lookup Engine
 * ========================================================
 * File: public/data/vietnam-postal/lookup.ts
 * 
 * Features:
 * - 100% Offline Local JSON Execution (Zero Runtime External APIs)
 * - Two-level administrative structure (Level 1: Provincial, Level 2: Commune)
 * - 28 Provinces + 6 Centrally Governed Cities = 34 Provincial Units
 * - 3,321 Commune-level Units (Wards, Communes, Special Administrative Zones)
 * - Pre-2025 Legacy District Crosswalk preservation
 * - Isomorphic dual-environment support (Node.js fs & Browser fetch)
 * - In-memory Map cache for sub-microsecond resolution
 */

export interface VietnamAdministrativeUnit {
  nameEn: string;
  nameVi: string;
  fullNameEn?: string;
  fullNameVi?: string;
  nameSearchNormalized?: string;
  administrativeLevel: 'Provincial' | 'Commune' | 'Postal Object';
  administrativeType: 'Province' | 'Centrally Governed City' | 'Ward' | 'Commune' | 'Special Administrative Zone' | 'Public Postal Service Point' | 'Government Postal Object' | 'Diplomatic Mission';
  officialCode: string;
  provinceCode?: string;
}

export interface VietnamLegacyDistrictData {
  districtName: string;
  districtFullName: string;
  districtNameEn?: string;
  districtCode: string;
  legacyProvinceName?: string;
  sourcePeriod: 'pre-2025';
}

export interface VietnamPostalRecord {
  postalCode: string;
  country: {
    nameEn: string;
    nameOfficialEn: string;
    nameVi: string;
    isoAlpha2: string;
    isoAlpha3: string;
    isoNumeric: string;
  };
  provinceRegion: VietnamAdministrativeUnit;
  commune: VietnamAdministrativeUnit;
  postalObject: {
    nameEn: string;
    nameVi: string;
    type: string;
    code: string;
    address?: string;
  };
  postOffice?: {
    nameEn: string;
    nameVi: string;
    officeType: string;
    officeCode: string;
    address?: string;
  } | null;
  legacyAdministrativeData?: VietnamLegacyDistrictData | null;
  source: {
    name: string;
    organization: string;
    url: string;
    documentReference?: string;
    sourceUpdatedAt: string | null;
    retrievedAt: string;
  };
}

export interface VietnamLookupResult {
  found: boolean;
  postalCode: string;
  matches: VietnamPostalRecord[];
  executionTimeMs: number;
  error?: string;
}

export interface VietnamIndexData {
  country: {
    nameEn: string;
    nameOfficialEn: string;
    nameVi: string;
    isoAlpha2: string;
    isoAlpha3: string;
    isoNumeric: string;
    phoneCode: string;
    flag: string;
  };
  postalCode: {
    length: number;
    type: string;
    format: string;
    regex: string;
  };
  administrativeStructure: {
    model: string;
    effectiveFrom: string;
    provincialLevelCount: number;
    provincesCount: number;
    centrallyGovernedCitiesCount: number;
    communeLevelCount: number;
  };
  statistics: {
    provincialUnits: number;
    provinces: number;
    centrallyGovernedCities: number;
    communeUnits: number;
    wards: number;
    communes: number;
    specialAdministrativeZones: number;
    specialPostalObjects: number;
    uniquePostalCodes: number;
    totalPostalRecords: number;
    multiMatchPostcodes: number;
  };
  postcodeMap: Record<
    string,
    {
      partition: string;
      provinceCode: string;
      provinceNameEn: string;
      provinceNameVi: string;
      administrativeType: string;
      communeNameEn: string;
      communeNameVi: string;
      communeType: string;
      isCentrallyGovernedCity: boolean;
    }
  >;
}

// In-Memory Caches
let cachedIndex: VietnamIndexData | null = null;
const partitionCache = new Map<string, { postalRecords: VietnamPostalRecord[] }>();
const queryResultCache = new Map<string, VietnamPostalRecord[]>();

const isBrowser = typeof window !== 'undefined';

/**
 * Validates and normalizes a Vietnamese 5-digit national postal code.
 */
export function validateVietnamPostalCode(raw: string | number): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  if (raw === null || raw === undefined) {
    return { valid: false, normalized: '', error: 'Postal code is required' };
  }

  const str = String(raw).trim().replace(/[\s-]+/g, '');

  if (!/^[0-9]+$/.test(str)) {
    return {
      valid: false,
      normalized: str,
      error: 'Postal code must contain only numeric digits',
    };
  }

  if (str.length < 5) {
    return {
      valid: false,
      normalized: str,
      error: `Postal code must be exactly 5 digits (currently ${str.length} digits)`,
    };
  }

  if (str.length > 5) {
    return {
      valid: false,
      normalized: str,
      error: `Postal code cannot exceed 5 digits (currently ${str.length} digits)`,
    };
  }

  return { valid: true, normalized: str };
}

/**
 * Loads a JSON file isomorphically.
 */
async function loadJson<T>(subPath: string): Promise<T> {
  if (isBrowser) {
    const url = `/data/vietnam-postal/${subPath}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load ${url}: HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } else {
    const fs = await import('fs/promises');
    const path = await import('path');
    const candidatePaths = [
      path.resolve(process.cwd(), 'public', 'data', 'vietnam-postal', subPath),
      path.resolve(process.cwd(), 'data', 'vietnam-postal', subPath),
    ];
    let content = '';
    for (const p of candidatePaths) {
      try {
        content = await fs.readFile(p, 'utf8');
        break;
      } catch {
        // try next
      }
    }
    if (!content) {
      throw new Error(`Local Vietnam postal file not found: ${subPath}`);
    }
    return JSON.parse(content) as T;
  }
}

/**
 * Retrieves the master index data.
 */
export async function getVietnamPostalIndex(): Promise<VietnamIndexData> {
  if (cachedIndex) return cachedIndex;
  cachedIndex = await loadJson<VietnamIndexData>('index.json');
  return cachedIndex;
}

/**
 * Looks up a Vietnamese 5-digit national postal code strictly offline.
 */
export async function lookupVietnamPostalCode(rawInput: string | number): Promise<VietnamLookupResult> {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const val = validateVietnamPostalCode(rawInput);
  if (!val.valid) {
    const tEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      found: false,
      postalCode: val.normalized,
      matches: [],
      executionTimeMs: Math.round((tEnd - t0) * 1000) / 1000,
      error: val.error,
    };
  }

  const pc = val.normalized;

  // Check query result cache for sub-microsecond resolution
  if (queryResultCache.has(pc)) {
    const cachedMatches = queryResultCache.get(pc)!;
    const tEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      found: cachedMatches.length > 0,
      postalCode: pc,
      matches: cachedMatches,
      executionTimeMs: Math.round((tEnd - t0) * 1000) / 1000,
    };
  }

  try {
    const index = await getVietnamPostalIndex();
    const entry = index.postcodeMap?.[pc];

    if (!entry) {
      const tEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
      queryResultCache.set(pc, []);
      return {
        found: false,
        postalCode: pc,
        matches: [],
        executionTimeMs: Math.round((tEnd - t0) * 1000) / 1000,
        error: `Postal code ${pc} is not currently registered in the national postal directory (mabuuchinh.vn / Decision 2334/QĐ-BKHCN).`,
      };
    }

    // Load only the required province or centrally governed city partition
    const partitionFile = entry.partition;
    let partitionData = partitionCache.get(partitionFile);

    if (!partitionData) {
      partitionData = await loadJson<{ postalRecords: VietnamPostalRecord[] }>(partitionFile);
      partitionCache.set(partitionFile, partitionData);
    }

    // Find all matching postal records (preserving multiple matches)
    const matchingRecords = (partitionData.postalRecords || []).filter((r) => r.postalCode === pc);

    queryResultCache.set(pc, matchingRecords);

    const tEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      found: matchingRecords.length > 0,
      postalCode: pc,
      matches: matchingRecords,
      executionTimeMs: Math.round((tEnd - t0) * 1000) / 1000,
    };
  } catch (err: any) {
    const tEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      found: false,
      postalCode: pc,
      matches: [],
      executionTimeMs: Math.round((tEnd - t0) * 1000) / 1000,
      error: `Local lookup failed: ${err.message || String(err)}`,
    };
  }
}
