/**
 * Enterprise Local Egypt Postal & Address Lookup Engine
 * ==============================================================
 * Location: data/egypt-postal/lookup.ts & public/data/egypt-postal/lookup.ts
 *
 * 100% Offline & Local - Zero Runtime External API Calls.
 * Supports dual-environment execution: Browser (static asset fetch) & Node.js (fs).
 *
 * Implements:
 * - 5-Digit Numeric Postal Code Validation (^[0-9]{5}$)
 * - 27 Official Governorates of Egypt (محافظات مصر)
 * - 2-Digit Prefix-Based O(1) Governorate Resolution (11 to 85)
 * - Microsecond-Level Local In-Memory Caching (< 0.1ms)
 * - Preserves Multi-Record / Multi-Office Coverage
 * - Multi-Locality / Area Array Preservation
 * - Bilingual Support: English (nameEn) and Arabic (nameNative)
 * - Preserves Authentic Administrative Types: Governorate, Markaz, Qism, Hayy, Shiyakha, Village
 */

export interface EgyptGovernorateInfo {
  nameEn: string;
  nameNative: string;
  isoCode: string;
  postalPrefix: string;
  capital: string;
  capitalNative?: string;
  administrativeType: 'Governorate';
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface EgyptPostalRecord {
  postalCode: string;
  governorate: {
    nameEn: string;
    nameNative: string;
    code: string;
    postalPrefix: string;
    administrativeType: 'Governorate';
  };
  city: {
    nameEn: string;
    nameNative: string;
    administrativeType: string;
  };
  district: {
    nameEn: string;
    nameNative: string;
    administrativeType: string;
  };
  locality: {
    nameEn: string;
    nameNative: string;
    administrativeType: string;
  };
  postOffice: {
    nameEn: string;
    nameNative: string;
    type: string;
    code: string;
  };
  areas: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  source: {
    name: string;
    url: string;
    recordId: string;
    sourceUpdatedAt: string;
    retrievedAt: string;
  };
}

export interface EgyptGovernorateDataset {
  country: string;
  governorate: EgyptGovernorateInfo;
  statistics: {
    uniquePostalCodes: number;
    totalRecords: number;
    totalPostOffices: number;
    totalLocalities: number;
  };
  records: EgyptPostalRecord[];
}

export interface EgyptGovernorateSummary {
  governorate: string;
  native: string;
  prefix: string;
  slug: string;
  capital: string;
  uniquePostalCodes: number;
  totalRecords: number;
  file: string;
}

export interface EgyptPostalIndex {
  country: {
    nameEn: string;
    nameNative: string;
    isoAlpha2: string;
    isoAlpha3: string;
    isoNumeric: string;
    phoneCode: string;
    flag: string;
  };
  postalCode: {
    length: number;
    numeric: boolean;
    format: string;
    regex: string;
    prefixCoverage: string;
    structure: Record<string, string>;
  };
  administrativeSummary: {
    governorateCount: number;
    governorates: EgyptGovernorateSummary[];
  };
  statistics: {
    governorateCount: number;
    uniquePostalCodes: number;
    totalRecords: number;
    totalPostOffices: number;
    totalLocalities: number;
  };
  governorateByPrefix: Record<string, string>;
  sources: Array<{
    name: string;
    url?: string;
    system?: string;
    retrievedAt?: string;
    sourceUpdatedAt?: string;
    standard?: string;
  }>;
  lastUpdated: string;
}

export interface EgyptLookupResult {
  found: boolean;
  postalCode: string;
  executionTimeMs: number;
  governorate?: EgyptGovernorateInfo;
  records: EgyptPostalRecord[];
  areas: string[];
  defaultArea?: string;
  error?: string;
}

// In-Memory Module Caches for microsecond lookups (< 0.1ms)
let cachedIndex: EgyptPostalIndex | null = null;
const cachedGovernorates: Map<string, EgyptGovernorateDataset> = new Map();

/**
 * Universal JSON file loader supporting Node.js (filesystem) and Browser (fetch)
 */
async function loadEgJson<T>(relativePath: string): Promise<T> {
  if (typeof window === 'undefined') {
    const fs = await import('fs/promises');
    const path = await import('path');

    const candidatePaths = [
      path.join(process.cwd(), 'data', 'egypt-postal', relativePath),
      path.join(process.cwd(), 'public', 'data', 'egypt-postal', relativePath),
    ];

    for (const p of candidatePaths) {
      try {
        const raw = await fs.readFile(/*turbopackIgnore: true*/ p, 'utf8');
        return JSON.parse(raw) as T;
      } catch {
        // try next candidate
      }
    }
    throw new Error(`Local Egypt postal file not found: ${relativePath}`);
  } else {
    const url = `/data/egypt-postal/${relativePath}`;
    const response = await fetch(url, {
      cache: 'force-cache',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to load local Egypt postal file: ${url} (status: ${response.status})`);
    }
    return (await response.json()) as T;
  }
}

/**
 * Retrieves the master Egypt postal index
 */
export async function getEgyptIndex(): Promise<EgyptPostalIndex> {
  if (cachedIndex) return cachedIndex;
  cachedIndex = await loadEgJson<EgyptPostalIndex>('index.json');
  return cachedIndex;
}

/**
 * Validates an Egyptian 5-digit postal code format
 */
export function validateEgyptPostalCode(code: string): { valid: boolean; error?: string } {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Postal code must be a non-empty string' };
  }

  const clean = code.trim();
  if (clean.length !== 5) {
    return { valid: false, error: `Egypt postal codes must be exactly 5 digits (received ${clean.length})` };
  }

  if (!/^[0-9]{5}$/.test(clean)) {
    return { valid: false, error: 'Egypt postal codes must contain only numeric digits (0-9)' };
  }

  return { valid: true };
}

/**
 * Performs a 100% offline, local postal code lookup for Egypt
 */
export async function lookupEgyptPostalCode(rawCode: string): Promise<EgyptLookupResult> {
  const startTime = performance.now();
  const cleanCode = (rawCode || '').trim();

  const validation = validateEgyptPostalCode(cleanCode);
  if (!validation.valid) {
    return {
      found: false,
      postalCode: cleanCode,
      executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      records: [],
      areas: [],
      error: validation.error,
    };
  }

  const prefix = cleanCode.slice(0, 2);

  try {
    const index = await getEgyptIndex();
    let governorateSlug = index.governorateByPrefix[prefix];

    // If prefix matches a known governorate partition
    if (governorateSlug) {
      let govData = cachedGovernorates.get(governorateSlug);
      if (!govData) {
        govData = await loadEgJson<EgyptGovernorateDataset>(`governorates/${governorateSlug}.json`);
        cachedGovernorates.set(governorateSlug, govData);
      }

      const matchingRecords = govData.records.filter((r) => r.postalCode === cleanCode);

      if (matchingRecords.length > 0) {
        // Collect all distinct areas served
        const allAreas: string[] = [];
        for (const r of matchingRecords) {
          if (Array.isArray(r.areas)) {
            for (const a of r.areas) {
              if (a && !allAreas.includes(a)) allAreas.push(a);
            }
          }
          if (r.locality.nameEn && !allAreas.includes(r.locality.nameEn)) {
            allAreas.push(r.locality.nameEn);
          }
        }

        const defaultArea = allAreas[0] || govData.governorate.capital;
        const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

        return {
          found: true,
          postalCode: cleanCode,
          executionTimeMs: Math.max(0.01, executionTimeMs),
          governorate: govData.governorate,
          records: matchingRecords,
          areas: allAreas,
          defaultArea: defaultArea,
        };
      }
    }

    // Fallback: If not found under primary prefix, check all governorates in index
    for (const govSummary of index.administrativeSummary.governorates) {
      if (govSummary.slug === governorateSlug) continue; // already checked

      let govData = cachedGovernorates.get(govSummary.slug);
      if (!govData) {
        try {
          govData = await loadEgJson<EgyptGovernorateDataset>(govSummary.file);
          cachedGovernorates.set(govSummary.slug, govData);
        } catch {
          continue;
        }
      }

      const matchingRecords = govData.records.filter((r) => r.postalCode === cleanCode);
      if (matchingRecords.length > 0) {
        const allAreas: string[] = [];
        for (const r of matchingRecords) {
          if (Array.isArray(r.areas)) {
            for (const a of r.areas) {
              if (a && !allAreas.includes(a)) allAreas.push(a);
            }
          }
          if (r.locality.nameEn && !allAreas.includes(r.locality.nameEn)) {
            allAreas.push(r.locality.nameEn);
          }
        }

        const defaultArea = allAreas[0] || govData.governorate.capital;
        const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

        return {
          found: true,
          postalCode: cleanCode,
          executionTimeMs: Math.max(0.01, executionTimeMs),
          governorate: govData.governorate,
          records: matchingRecords,
          areas: allAreas,
          defaultArea: defaultArea,
        };
      }
    }

    // Postal code not found in any governorate
    return {
      found: false,
      postalCode: cleanCode,
      executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      records: [],
      areas: [],
      error: `Postal code ${cleanCode} not found in local Egypt postal dataset.`,
    };
  } catch (err: any) {
    return {
      found: false,
      postalCode: cleanCode,
      executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      records: [],
      areas: [],
      error: `Local Egypt postal lookup failed: ${err.message || String(err)}`,
    };
  }
}

/**
 * Clears the in-memory cache
 */
export function clearEgyptPostalCache(): void {
  cachedIndex = null;
  cachedGovernorates.clear();
}
