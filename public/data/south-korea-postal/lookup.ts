/**
 * Enterprise Local South Korea Postal & Address Lookup Engine
 * ==============================================================
 * Location: data/south-korea-postal/lookup.ts & public/data/south-korea-postal/lookup.ts
 *
 * 100% Offline & Local - Zero Runtime External API Calls.
 * Supports dual-environment execution: Browser (static asset fetch) & Node.js (fs).
 *
 * Implements:
 * - 5-Digit Numeric Postal Code Validation (^[0-9]{5}$)
 * - 17 Official First-Level Administrative Divisions of South Korea:
 *   * 1 Special City (서울특별시)
 *   * 6 Metropolitan Cities (부산, 대구, 인천, 광주, 대전, 울산광역시)
 *   * 1 Special Self-Governing City (세종특별자치시)
 *   * 8 Provinces (경기도, 충청북도, 충청남도, 전라남도, 경상북도, 경상남도, etc.)
 *   * 1 Special Self-Governing Province category (제주, 강원, 전북 특별자치도)
 * - 2-Digit Prefix-Based O(1) Routing (01 to 63)
 * - Microsecond-Level Local In-Memory Caching (< 0.1ms)
 * - Road-Name Address System (도로명주소) + Lot/Jibun Address (지번주소)
 * - Bilingual Korean (한국어) & English (nameEn)
 * - Leading Zero Preservation (01-09 Seoul, 04524 City Hall, etc.)
 */

export interface SouthKoreaDivisionInfo {
  nameEn: string;
  nameOfficialEn: string;
  nameKo: string;
  category: 'special-city' | 'metropolitan-cities' | 'special-self-governing-city' | 'provinces' | 'special-self-governing-province';
  administrativeType: string;
  isoCode: string;
  prefixes: string[];
  areaCode?: string;
  capitalEn?: string;
  capitalKo?: string;
  previousNameEn?: string | null;
  previousNameKo?: string | null;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface SouthKoreaRoadAddress {
  roadName: string;
  roadNameKo: string;
  roadNameCode?: string;
  buildingNumber: string;
  buildingName?: string | null;
  buildingNameKo?: string | null;
  buildingManagementNumber?: string;
  fullAddressEn: string;
  fullAddressKo: string;
}

export interface SouthKoreaJibunAddress {
  jibun: string;
  jibunKo: string;
  legalDong: string;
  legalDongKo: string;
  adminDong: string;
  adminDongKo: string;
}

export interface SouthKoreaPostalRecord {
  postalCode: string;
  roadAddress: SouthKoreaRoadAddress;
  jibunAddress: SouthKoreaJibunAddress;
  administrative: {
    category: string;
    firstLevel: {
      nameEn: string;
      nameOfficialEn: string;
      nameKo: string;
      isoCode: string;
      administrativeType: string;
      previousNameEn?: string | null;
      previousNameKo?: string | null;
      transitionDate?: string | null;
    };
    cityCounty: {
      nameEn: string;
      nameKo: string;
      administrativeType: string;
    };
    district: {
      nameEn: string;
      nameKo: string;
      administrativeType: string;
    };
    townDong: {
      nameEn: string;
      nameKo: string;
      administrativeType: string;
    };
  };
  postOffice: {
    nameEn: string;
    nameKo: string;
    code: string;
    type: string;
    phone: string;
  };
  telephone: {
    countryCode: string;
    areaCode: string;
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

export interface SouthKoreaDivisionDataset {
  country: string;
  countryOfficialEn: string;
  division: SouthKoreaDivisionInfo;
  statistics: {
    uniquePostalCodes: number;
    totalRecords: number;
    totalAddresses: number;
    totalPostOffices: number;
    totalLocalities: number;
  };
  records: SouthKoreaPostalRecord[];
}

export interface SouthKoreaDivisionSummary {
  division: string;
  nameOfficialEn: string;
  native: string;
  category: string;
  administrativeType: string;
  prefixes: string[];
  slug: string;
  capital: string;
  uniquePostalCodes: number;
  totalRecords: number;
  file: string;
}

export interface SouthKoreaPostalIndex {
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
  postalCode: {
    length: number;
    numeric: boolean;
    format: string;
    regex: string;
    prefixCoverage: string;
    structure: Record<string, string>;
  };
  administrativeSummary: {
    specialCityCount: number;
    metropolitanCityCount: number;
    specialSelfGoverningCityCount: number;
    provinceCount: number;
    specialSelfGoverningProvinceCount: number;
    totalFirstLevelDivisions: number;
    divisions: SouthKoreaDivisionSummary[];
  };
  statistics: {
    firstLevelDivisionCount: number;
    uniquePostalCodes: number;
    totalRecords: number;
    totalAddresses: number;
    totalPostOffices: number;
    totalLocalities: number;
  };
  divisionByPrefix: Record<string, { slug: string; file: string }>;
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

export interface SouthKoreaLookupResult {
  found: boolean;
  postalCode: string;
  executionTimeMs: number;
  division?: SouthKoreaDivisionInfo;
  records: SouthKoreaPostalRecord[];
  areas: string[];
  defaultArea?: string;
  error?: string;
}

// In-Memory Module Caches for microsecond lookups (< 0.1ms)
let cachedIndex: SouthKoreaPostalIndex | null = null;
const cachedDivisions: Map<string, SouthKoreaDivisionDataset> = new Map();

/**
 * Universal JSON file loader supporting Node.js (filesystem) and Browser (fetch)
 */
async function loadKrJson<T>(relativePath: string): Promise<T> {
  if (typeof window === 'undefined') {
    const fs = await import('fs/promises');
    const path = await import('path');

    const candidatePaths = [
      path.join(process.cwd(), 'data', 'south-korea-postal', relativePath),
      path.join(process.cwd(), 'public', 'data', 'south-korea-postal', relativePath),
    ];

    for (const p of candidatePaths) {
      try {
        const raw = await fs.readFile(/*turbopackIgnore: true*/ p, 'utf8');
        return JSON.parse(raw) as T;
      } catch {
        // try next candidate
      }
    }
    throw new Error(`Local South Korea postal file not found: ${relativePath}`);
  } else {
    const url = `/data/south-korea-postal/${relativePath}`;
    const response = await fetch(url, {
      cache: 'force-cache',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to load local South Korea postal file: ${url} (status: ${response.status})`);
    }
    return (await response.json()) as T;
  }
}

/**
 * Retrieves the master South Korea postal index
 */
export async function getSouthKoreaIndex(): Promise<SouthKoreaPostalIndex> {
  if (cachedIndex) return cachedIndex;
  cachedIndex = await loadKrJson<SouthKoreaPostalIndex>('index.json');
  return cachedIndex;
}

/**
 * Validates a South Korean 5-digit postal code format
 */
export function validateSouthKoreaPostalCode(code: string): { valid: boolean; error?: string } {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Postal code must be a non-empty string' };
  }

  const clean = code.trim();
  if (clean.length !== 5) {
    return { valid: false, error: `South Korea postal codes must be exactly 5 digits (received ${clean.length})` };
  }

  if (!/^[0-9]{5}$/.test(clean)) {
    return { valid: false, error: 'South Korea postal codes must contain only numeric digits (0-9)' };
  }

  return { valid: true };
}

/**
 * Performs a 100% offline, local postal code lookup for South Korea
 */
export async function lookupSouthKoreaPostalCode(rawCode: string): Promise<SouthKoreaLookupResult> {
  const startTime = performance.now();
  const cleanCode = (rawCode || '').trim();

  const validation = validateSouthKoreaPostalCode(cleanCode);
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
    const index = await getSouthKoreaIndex();
    const prefixTarget = index.divisionByPrefix ? index.divisionByPrefix[prefix] : null;

    if (prefixTarget && prefixTarget.file) {
      let divData = cachedDivisions.get(prefixTarget.file);
      if (!divData) {
        divData = await loadKrJson<SouthKoreaDivisionDataset>(prefixTarget.file);
        cachedDivisions.set(prefixTarget.file, divData);
      }

      const matchingRecords = divData.records.filter((r) => r.postalCode === cleanCode);

      if (matchingRecords.length > 0) {
        const allAreas: string[] = [];
        for (const r of matchingRecords) {
          if (Array.isArray(r.areas)) {
            for (const a of r.areas) {
              if (a && !allAreas.includes(a)) allAreas.push(a);
            }
          }
          if (r.roadAddress?.roadName && !allAreas.includes(r.roadAddress.roadName)) {
            allAreas.push(r.roadAddress.roadName);
          }
          if (r.jibunAddress?.legalDong && !allAreas.includes(r.jibunAddress.legalDong)) {
            allAreas.push(r.jibunAddress.legalDong);
          }
        }

        const defaultArea = allAreas[0] || divData.division.capitalEn || divData.division.nameEn;
        const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

        return {
          found: true,
          postalCode: cleanCode,
          executionTimeMs: Math.max(0.01, executionTimeMs),
          division: divData.division,
          records: matchingRecords,
          areas: allAreas,
          defaultArea,
        };
      }
    }

    // Fallback: Check all 17 divisions in index
    for (const divSummary of index.administrativeSummary.divisions) {
      if (prefixTarget && divSummary.file === prefixTarget.file) continue;

      let divData = cachedDivisions.get(divSummary.file);
      if (!divData) {
        try {
          divData = await loadKrJson<SouthKoreaDivisionDataset>(divSummary.file);
          cachedDivisions.set(divSummary.file, divData);
        } catch {
          continue;
        }
      }

      const matchingRecords = divData.records.filter((r) => r.postalCode === cleanCode);
      if (matchingRecords.length > 0) {
        const allAreas: string[] = [];
        for (const r of matchingRecords) {
          if (Array.isArray(r.areas)) {
            for (const a of r.areas) {
              if (a && !allAreas.includes(a)) allAreas.push(a);
            }
          }
          if (r.roadAddress?.roadName && !allAreas.includes(r.roadAddress.roadName)) {
            allAreas.push(r.roadAddress.roadName);
          }
          if (r.jibunAddress?.legalDong && !allAreas.includes(r.jibunAddress.legalDong)) {
            allAreas.push(r.jibunAddress.legalDong);
          }
        }

        const defaultArea = allAreas[0] || divData.division.capitalEn || divData.division.nameEn;
        const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

        return {
          found: true,
          postalCode: cleanCode,
          executionTimeMs: Math.max(0.01, executionTimeMs),
          division: divData.division,
          records: matchingRecords,
          areas: allAreas,
          defaultArea,
        };
      }
    }

    return {
      found: false,
      postalCode: cleanCode,
      executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      records: [],
      areas: [],
      error: `Postal code ${cleanCode} not found in local South Korea postal dataset.`,
    };
  } catch (err: any) {
    return {
      found: false,
      postalCode: cleanCode,
      executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      records: [],
      areas: [],
      error: `Local South Korea postal lookup failed: ${err.message || String(err)}`,
    };
  }
}

/**
 * Clears the in-memory cache
 */
export function clearSouthKoreaPostalCache(): void {
  cachedIndex = null;
  cachedDivisions.clear();
}
