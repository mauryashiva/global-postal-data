/**
 * Enterprise Local China Postal & Administrative Lookup Engine
 * =============================================================
 * Location: data/china-postal/lookup.ts & public/data/china-postal/lookup.ts
 *
 * 100% Offline & Local - Zero Runtime API Calls.
 * Supports dual-environment execution: Browser (offline fetch) & Node.js (fs).
 *
 * Implements:
 * - 6-Digit Numeric Postal Code Validation (^[0-9]{6}$)
 * - 34 Province-Level Divisions (23 Provinces, 5 Autonomous Regions, 4 Municipalities, 2 SARs)
 * - Multiple Matches Retention ({ postalCode, matches: [...] })
 * - Multilingual Fields: English (nameEn), Simplified Chinese (nameZh), Pinyin (namePinyin)
 * - Coexistence of ERP UI-Friendly Names and Official Administrative Classifications
 */

export interface ChinaAdminUnit {
  nameEn: string;
  nameZh: string;
  namePinyin: string;
  administrativeType: string;
  code?: string | null;
}

export interface ChinaLocalityUnit {
  nameEn: string;
  nameZh: string;
  namePinyin: string;
}

export interface ChinaPostOfficeUnit {
  nameEn: string;
  nameZh: string;
  namePinyin: string;
  type?: string;
  code?: string;
}

export interface ChinaPostalMatch {
  country: string;
  provinceRegion: ChinaAdminUnit;
  city: ChinaAdminUnit;
  prefectureCounty: ChinaAdminUnit;
  locality?: ChinaLocalityUnit;
  postOffice?: ChinaPostOfficeUnit;
  latitude?: number | null;
  longitude?: number | null;
  source?: {
    name: string;
    recordId: string;
    retrievedAt?: string;
  };
}

export interface ChinaPostalRecord {
  postalCode: string;
  provinceRegion: ChinaAdminUnit;
  matches: ChinaPostalMatch[];
}

export interface ChinaDivisionMeta {
  nameEn: string;
  nameZh: string;
  namePinyin: string;
  administrativeType: 'Province' | 'Autonomous Region' | 'Municipality' | 'Special Administrative Region';
  code: string;
  slug: string;
  folder: string;
  file: string;
  uniquePostalCodes: number;
  totalRecords: number;
}

export interface ChinaPostalDirectoryEntry {
  slug: string;
  folder: string;
  provinceEn: string;
  provinceZh: string;
}

export interface ChinaPostalIndex {
  country: {
    nameEn: string;
    nameZh: string;
    isoAlpha2: string;
    isoAlpha3: string;
    isoNumeric: string;
    phoneCode: string;
    flag: string;
  };
  postalCode: {
    length: number;
    format: string;
    numeric: boolean;
    regex: string;
  };
  administrativeSummary: {
    provinceCount: number;
    autonomousRegionCount: number;
    municipalityCount: number;
    specialAdministrativeRegionCount: number;
    totalProvinceLevelDivisions: number;
  };
  sources: Array<{
    name: string;
    standard?: string;
    description?: string;
    url: string;
    retrievedAt: string;
  }>;
  statistics: {
    uniquePostalCodes: number;
    totalRecords: number;
    totalProvinces: number;
    totalAutonomousRegions: number;
    totalMunicipalities: number;
    totalSARs: number;
    totalDivisions: number;
  };
  divisions: ChinaDivisionMeta[];
  postalCodeDirectory: Record<string, ChinaPostalDirectoryEntry>;
}

export interface ChinaPostalLookupResult {
  found: boolean;
  postalCode: string;
  country: {
    nameEn: string;
    nameZh: string;
    isoAlpha2: string;
    isoAlpha3: string;
    phoneCode: string;
    flag: string;
  };
  provinceRegion?: ChinaAdminUnit;
  matches: ChinaPostalMatch[];
  error?: string;
}

export interface PopulatedChinaAddress {
  // ERP UI-Friendly Field Names
  country: string;
  provinceRegion: string;
  city: string;
  prefectureCounty: string;
  postalCode: string;
  postOfficeLocality: string;
  addressLine1?: string;
  addressLine2?: string;

  // Bilingual & Administrative Metadata
  bilingual: {
    provinceEn: string;
    provinceZh: string;
    provincePinyin: string;
    provinceAdminType: string;

    cityEn: string;
    cityZh: string;
    cityPinyin: string;
    cityAdminType: string;

    countyEn: string;
    countyZh: string;
    countyPinyin: string;
    countyAdminType: string;

    localityEn?: string;
    localityZh?: string;
    postOfficeEn?: string;
    postOfficeZh?: string;
  };

  coordinates?: {
    latitude: number | null;
    longitude: number | null;
  };

  source?: {
    name: string;
    recordId: string;
  };
}

// In-memory runtime cache for microsecond offline lookups
let cachedIndex: ChinaPostalIndex | null = null;
const divisionDatasetCache = new Map<string, ChinaPostalRecord[]>();

/**
 * Validate that a China postal code is exactly 6 numeric digits
 * Strict validation: rejects 4, 5, 7, 8 or alphanumeric codes.
 */
export function validateChinaPostalCode(code: string): boolean {
  if (!code) return false;
  return /^[0-9]{6}$/.test(code.trim());
}

/**
 * Clean a China postal code string
 */
export function cleanChinaPostalCode(code: string): string {
  return String(code || '').trim().replace(/\D/g, '').slice(0, 6);
}

/**
 * Load local JSON file based on runtime environment (Node.js vs Browser)
 */
async function loadLocalJson<T>(relativePath: string): Promise<T> {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const url = await import('node:url');

    let currentDir = process.cwd();
    try {
      if (typeof import.meta !== 'undefined' && import.meta.url) {
        currentDir = path.dirname(url.fileURLToPath(import.meta.url));
      }
    } catch {
      // fallback to process.cwd()
    }

    const candidatePaths = [
      path.resolve(currentDir, relativePath),
      path.join(process.cwd(), 'data', 'china-postal', relativePath),
      path.join(process.cwd(), 'public', 'data', 'china-postal', relativePath),
    ];

    for (const p of candidatePaths) {
      try {
        const raw = await fs.readFile(/*turbopackIgnore: true*/ p, 'utf8');
        return JSON.parse(raw) as T;
      } catch {
        // try next path
      }
    }
    throw new Error(`Local China postal file not found: ${relativePath}`);
  } else {
    // Client Browser: fetch from public static assets
    const url = `/data/china-postal/${relativePath}`;
    const response = await fetch(url, {
      cache: 'force-cache',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to load China postal file: ${url} (status: ${response.status})`);
    }
    return (await response.json()) as T;
  }
}

/**
 * Load and cache index.json
 */
export async function getChinaPostalIndex(): Promise<ChinaPostalIndex> {
  if (cachedIndex) return cachedIndex;
  cachedIndex = await loadLocalJson<ChinaPostalIndex>('index.json');
  return cachedIndex;
}

/**
 * Lookup a 6-digit China Postal Code from local dataset.
 * 100% Offline - Zero runtime network or external API dependencies.
 */
export async function lookupChinaPostalCode(inputPostalCode: string): Promise<ChinaPostalLookupResult> {
  const postalCode = cleanChinaPostalCode(inputPostalCode);

  if (!validateChinaPostalCode(postalCode)) {
    return {
      found: false,
      postalCode,
      country: {
        nameEn: 'China',
        nameZh: '中国',
        isoAlpha2: 'CN',
        isoAlpha3: 'CHN',
        phoneCode: '+86',
        flag: '🇨🇳'
      },
      matches: [],
      error: 'Invalid postal code format. Must contain exactly 6 numeric digits (^[0-9]{6}$).'
    };
  }

  try {
    const index = await getChinaPostalIndex();
    const entry = index.postalCodeDirectory[postalCode];

    if (!entry) {
      return {
        found: false,
        postalCode,
        country: index.country,
        matches: [],
        error: `Postal code ${postalCode} not found in China postal directory.`
      };
    }

    const relativeFilePath = `${entry.folder}/${entry.slug}.json`;

    // Load and cache division file
    let records = divisionDatasetCache.get(entry.slug);
    if (!records) {
      records = await loadLocalJson<ChinaPostalRecord[]>(relativeFilePath);
      divisionDatasetCache.set(entry.slug, records);
    }

    const record = records.find(r => r.postalCode === postalCode);
    if (!record || !record.matches || record.matches.length === 0) {
      return {
        found: false,
        postalCode,
        country: index.country,
        matches: [],
        error: `No administrative records found for postal code ${postalCode}.`
      };
    }

    return {
      found: true,
      postalCode,
      country: index.country,
      provinceRegion: record.provinceRegion,
      matches: record.matches
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      found: false,
      postalCode,
      country: {
        nameEn: 'China',
        nameZh: '中国',
        isoAlpha2: 'CN',
        isoAlpha3: 'CHN',
        phoneCode: '+86',
        flag: '🇨🇳'
      },
      matches: [],
      error: `Local China lookup failed: ${message}`
    };
  }
}

/**
 * Format and populate complete ERP address fields when user selects a match.
 * Preserves user-friendly ERP field names alongside full official administrative data.
 */
export function populateChinaAddressFields(
  match: ChinaPostalMatch,
  postalCode: string,
  premises?: { addressLine1?: string; addressLine2?: string }
): PopulatedChinaAddress {
  const provinceStr = `${match.provinceRegion.nameEn} (${match.provinceRegion.nameZh})`;
  const cityStr = match.city.nameEn !== match.provinceRegion.nameEn
    ? `${match.city.nameEn} (${match.city.nameZh})`
    : match.city.nameEn;
  const countyStr = `${match.prefectureCounty.nameEn} (${match.prefectureCounty.nameZh})`;
  const localityStr = match.locality
    ? `${match.locality.nameEn} (${match.locality.nameZh})`
    : countyStr;

  return {
    // Standard ERP UI-Friendly Field Names (Section 8)
    country: 'China',
    provinceRegion: provinceStr,
    city: cityStr,
    prefectureCounty: countyStr,
    postalCode,
    postOfficeLocality: localityStr,
    addressLine1: premises?.addressLine1 || '',
    addressLine2: premises?.addressLine2 || '',

    // Full Bilingual & Official Administrative Metadata (Section 9 & 10)
    bilingual: {
      provinceEn: match.provinceRegion.nameEn,
      provinceZh: match.provinceRegion.nameZh,
      provincePinyin: match.provinceRegion.namePinyin,
      provinceAdminType: match.provinceRegion.administrativeType,

      cityEn: match.city.nameEn,
      cityZh: match.city.nameZh,
      cityPinyin: match.city.namePinyin,
      cityAdminType: match.city.administrativeType,

      countyEn: match.prefectureCounty.nameEn,
      countyZh: match.prefectureCounty.nameZh,
      countyPinyin: match.prefectureCounty.namePinyin,
      countyAdminType: match.prefectureCounty.administrativeType,

      localityEn: match.locality?.nameEn,
      localityZh: match.locality?.nameZh,
      postOfficeEn: match.postOffice?.nameEn,
      postOfficeZh: match.postOffice?.nameZh
    },

    coordinates: {
      latitude: match.latitude || null,
      longitude: match.longitude || null
    },

    source: match.source
  };
}

/**
 * Clear in-memory caches
 */
export function clearChinaPostalCache(): void {
  cachedIndex = null;
  divisionDatasetCache.clear();
}
