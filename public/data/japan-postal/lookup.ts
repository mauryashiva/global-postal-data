/**
 * Japan Postal Code & Administrative Offline Lookup Engine
 * ========================================================
 * Location: public/data/japan-postal/lookup.ts & data/japan-postal/lookup.ts
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. Zero Runtime External API Calls (no Japan Post API, no Google Maps, no external geocoders).
 * 2. 100% offline local JSON loading using O(1) 3-digit prefix partition routing.
 * 3. In-memory LRU caching to eliminate repeated file I/O or network fetches.
 * 4. Dual-environment support (Node.js fs & Browser fetch).
 * 5. Preserves 47 Prefectures with official administrative types (To, Do, Fu, Ken).
 * 6. Preserves Tokyo 23 Special Wards, Ordinance-designated City Wards, and Counties (Gun).
 * 7. Distinguishes normal AREA postal codes from individual BUSINESS postal codes (大口事業所個別番号).
 * 8. Preserves Japanese Kanji (nameJa), Katakana (nameKana), Romaji (nameRomaji), and English (nameEn).
 * 9. Preserves official Japan Post flags (hasChome, smallAreaNumbering, multiplePostalCodesForTownArea).
 */

export interface JapanMunicipality {
  jisCode: string;
  nameEn: string;
  nameJa: string;
  nameKana: string;
  nameRomaji: string;
  administrativeType: 'Special Ward' | 'Designated City Ward' | 'Core City' | 'City' | 'Town' | 'Village' | string;
  parentCityJa?: string;
  parentCityEn?: string;
  countyNameJa?: string;
  countyNameEn?: string;
  subprefectureJa?: string;
  subprefectureEn?: string;
}

export interface JapanTownArea {
  nameEn: string;
  nameJa: string;
  nameKana: string;
  nameRomaji: string;
  type?: 'NormalTownArea' | 'NoTownAreaListed' | 'AddressImmediatelyAfterMunicipality' | 'EntireMunicipalityArea' | string;
  landmarkEn?: string;
  descriptionEn?: string;
}

export interface JapanPostalFlags {
  multiplePostalCodesForTownArea: boolean;
  smallAreaNumbering: boolean;
  hasChome: boolean;
  postalCodeCoversMultipleTownAreas: boolean;
}

export interface JapanAreaPostalRecord {
  postalCode: string;
  postalCodeFormatted: string;
  postalCodeType: 'AREA';
  prefectureCode: string;
  prefectureNameEn: string;
  prefectureNameJa: string;
  prefectureNameKana: string;
  prefectureNameRomaji: string;
  administrativeType: 'To' | 'Do' | 'Fu' | 'Ken';
  municipality: JapanMunicipality;
  townArea: JapanTownArea;
  flags: JapanPostalFlags;
  sourceUpdateFlag?: number;
  sourceChangeReason?: number;
}

export interface JapanBusinessPostalRecord {
  postalCode: string;
  postalCodeFormatted: string;
  postalCodeType: 'BUSINESS';
  businessName: string;
  businessNameJa: string;
  businessNameKana: string;
  businessNameRomaji?: string;
  addressLineJa: string;
  addressLineEn: string;
  prefectureCode: string;
  prefectureNameEn: string;
  prefectureNameJa: string;
  municipalityNameJa: string;
  municipalityNameEn: string;
  townAreaNameJa?: string;
  townAreaNameEn?: string;
  poBoxNumber?: string | null;
}

export type JapanPostalRecord = JapanAreaPostalRecord | JapanBusinessPostalRecord;

export interface JapanValidationResult {
  valid: boolean;
  normalized?: string;
  formatted?: string;
  error?: string;
}

export interface JapanLookupResult {
  found: boolean;
  postalCode: string;
  postalCodeFormatted: string;
  postalCodeType?: 'AREA' | 'BUSINESS';
  matches: JapanPostalRecord[];
  primaryMatch?: JapanPostalRecord;
  isAmbiguous?: boolean;
  ambiguityNotice?: string;
  executionTimeMs: number;
  error?: string;
}

export interface JapanIndexData {
  country: {
    nameEn: string;
    nameJa: string;
    isoAlpha2: string;
    isoAlpha3: string;
    isoNumeric: string;
    phoneCode: string;
    currency: string;
    flag: string;
  };
  administrativeSummary: {
    prefectureCount: number;
  };
  statistics: {
    uniquePostalCodes: number;
    uniqueAreaPostalCodes: number;
    uniqueBusinessPostalCodes: number;
    areaRecords: number;
    businessRecords: number;
    totalRecords: number;
  };
}

// In-Memory LRU Cache
const prefixCache = new Map<string, { prefix: string; records: JapanPostalRecord[] }>();
let cachedIndex: JapanIndexData | null = null;
const MAX_CACHE_ENTRIES = 50;

/**
 * Normalizes input postal code:
 * 1. Converts to string, trims whitespace
 * 2. Removes spaces and hyphen variants
 * 3. Preserves leading zeros as a 7-character string
 */
export function normalizeJapanPostalCode(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const clean = raw.trim().replace(/[\s\u3000\u2212\uFF0D-]+/g, '');
  return clean;
}

/**
 * Formats a 7-digit postal code as XXX-XXXX.
 */
export function formatJapanPostalCode(raw: string): string {
  const norm = normalizeJapanPostalCode(raw);
  if (/^[0-9]{7}$/.test(norm)) {
    return `${norm.slice(0, 3)}-${norm.slice(3, 7)}`;
  }
  return raw;
}

/**
 * Validates Japan 7-digit postal code.
 */
export function validateJapanPostalCode(raw: string): JapanValidationResult {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, error: 'Postal code cannot be empty.' };
  }
  const normalized = normalizeJapanPostalCode(raw);
  if (!/^[0-9]{7}$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: `Invalid Japan postal code "${raw.trim()}". Expected exactly 7 numeric digits (e.g. 100-0001 or 1000001).`,
    };
  }

  return {
    valid: true,
    normalized,
    formatted: formatJapanPostalCode(normalized),
  };
}

/**
 * Universal JSON loader supporting Node.js filesystem and browser fetch.
 */
async function loadJapanJson<T>(subPath: string): Promise<T | null> {
  const isNode = typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node;

  if (isNode) {
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const baseDir = path.resolve(process.cwd(), 'public', 'data', 'japan-postal');
      const fullPath = path.join(baseDir, ...subPath.split('/'));
      if (!fs.existsSync(fullPath)) {
        // Fallback to data/japan-postal
        const fallbackDir = path.resolve(process.cwd(), 'data', 'japan-postal');
        const fallbackPath = path.join(fallbackDir, ...subPath.split('/'));
        if (fs.existsSync(fallbackPath)) {
          const raw = fs.readFileSync(fallbackPath, 'utf8');
          return JSON.parse(raw) as T;
        }
        return null;
      }
      const raw = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error(`[loadJapanJson] Node fs load failed for ${subPath}:`, err);
      return null;
    }
  } else {
    try {
      const url = `/data/japan-postal/${subPath}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch (err) {
      console.error(`[loadJapanJson] Browser fetch failed for ${subPath}:`, err);
      return null;
    }
  }
}

/**
 * Returns master index with in-memory caching.
 */
export async function getJapanIndex(): Promise<JapanIndexData> {
  if (cachedIndex) return cachedIndex;
  const data = await loadJapanJson<JapanIndexData>('index.json');
  if (!data) {
    throw new Error('Failed to load local Japan master index.json');
  }
  cachedIndex = data;
  return data;
}

/**
 * Loads a 3-digit prefix partition (e.g. "100.json", "060.json") with LRU cache.
 */
export async function loadPrefixDataset(prefix: string): Promise<{ prefix: string; records: JapanPostalRecord[] } | null> {
  if (prefixCache.has(prefix)) {
    const data = prefixCache.get(prefix)!;
    // LRU refresh
    prefixCache.delete(prefix);
    prefixCache.set(prefix, data);
    return data;
  }

  const partition = await loadJapanJson<{ prefix: string; records: JapanPostalRecord[] }>(`postal-index/${prefix}.json`);
  if (!partition) return null;

  if (prefixCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = prefixCache.keys().next().value;
    if (oldestKey) prefixCache.delete(oldestKey);
  }
  prefixCache.set(prefix, partition);
  return partition;
}

/**
 * Main offline lookup function for Japanese postal codes.
 * Guarantees zero external API calls at runtime.
 */
export async function lookupJapanPostalCode(rawInput: string): Promise<JapanLookupResult> {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const validation = validateJapanPostalCode(rawInput);
  if (!validation.valid || !validation.normalized) {
    const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    return {
      found: false,
      postalCode: rawInput,
      postalCodeFormatted: rawInput,
      matches: [],
      executionTimeMs: duration,
      error: validation.error || 'Invalid Japanese postal code format.',
    };
  }

  const normalized = validation.normalized;
  const formatted = validation.formatted || formatJapanPostalCode(normalized);
  const prefix = normalized.slice(0, 3);

  const partition = await loadPrefixDataset(prefix);
  const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;

  if (!partition || !partition.records || partition.records.length === 0) {
    return {
      found: false,
      postalCode: normalized,
      postalCodeFormatted: formatted,
      matches: [],
      executionTimeMs: duration,
      error: `Postal code "${formatted}" not found in local Japan dataset. You can continue entering the address manually.`,
    };
  }

  // Exact match search
  const matches = partition.records.filter(r => r.postalCode === normalized);

  if (matches.length === 0) {
    return {
      found: false,
      postalCode: normalized,
      postalCodeFormatted: formatted,
      matches: [],
      executionTimeMs: duration,
      error: `Postal code "${formatted}" not found in local Japan dataset. You can continue entering the address manually.`,
    };
  }

  const primary = matches[0];
  const isBusiness = primary.postalCodeType === 'BUSINESS';

  // Check if Japan Post flagged this area as requiring additional address info
  let isAmbiguous = false;
  let ambiguityNotice: string | undefined = undefined;

  if (!isBusiness && 'flags' in primary) {
    const flags = (primary as JapanAreaPostalRecord).flags;
    if (flags.multiplePostalCodesForTownArea || flags.smallAreaNumbering) {
      isAmbiguous = true;
      ambiguityNotice = 'Additional address information (Chome / Banchi) may be required to identify the exact location.';
    }
  }

  return {
    found: true,
    postalCode: normalized,
    postalCodeFormatted: formatted,
    postalCodeType: primary.postalCodeType,
    matches,
    primaryMatch: primary,
    isAmbiguous,
    ambiguityNotice,
    executionTimeMs: duration,
  };
}
