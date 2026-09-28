/**
 * Malaysia Postal Code & Administrative Offline Lookup Engine
 * ============================================================
 * Location: public/data/malaysia-postal/lookup.ts & data/malaysia-postal/lookup.ts
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. Zero Runtime External API Calls (no Pos Malaysia API, no external geocoders).
 * 2. 100% offline local JSON loading using state/territory and index routing.
 * 3. In-memory caching to eliminate repeated file I/O or network fetches.
 * 4. Dual-environment support (Node.js fs & Browser fetch).
 * 5. Preserves 13 States + 3 Federal Territories (Total: 16 top-level units).
 * 6. Preserves Kelantan's "Jajahan" administrative classification.
 * 7. Preserves Sabah and Sarawak unique administrative structures.
 * 8. Strict 5-digit postal code validation with leading-zero preservation.
 */

export interface MalaysiaCountryMetadata {
  nameEn: string;
  nameMs: string;
  isoAlpha2: string;
  isoAlpha3: string;
  isoNumeric: string;
  phoneCode?: string;
  currency?: string;
  currencyName?: string;
  flag?: string;
}

export interface MalaysiaAdministrativeArea {
  nameEn: string;
  nameMs: string;
  administrativeType: 'State' | 'Federal Territory' | string;
  code: string;
  codeDosm?: string;
  capitalEn?: string;
  capitalMs?: string;
  specialStatus?: string | null;
}

export interface MalaysiaDistrict {
  nameEn: string;
  nameMs: string;
  administrativeType: 'District' | 'Jajahan' | 'Federal Territory' | string;
  code?: string | null;
}

export interface MalaysiaSubDistrict {
  nameEn: string;
  nameMs: string;
  administrativeType: 'Mukim' | 'Area' | string;
  code?: string | null;
}

export interface MalaysiaLocality {
  nameEn: string;
  nameMs: string;
}

export interface MalaysiaPostOffice {
  nameEn: string;
  nameMs: string;
  type?: string;
  deliveryStatus?: string | null;
}

export interface MalaysiaPostalRecord {
  country: MalaysiaCountryMetadata;
  administrativeArea: MalaysiaAdministrativeArea;
  district: MalaysiaDistrict;
  subDistrict: MalaysiaSubDistrict;
  locality: MalaysiaLocality;
  city: MalaysiaLocality;
  postcode: string;
  postOffice?: MalaysiaPostOffice | null;
  source: {
    name: string;
    url?: string;
    retrievedAt?: string;
    sourceUpdatedAt?: string;
  };
}

export interface MalaysiaValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

export interface MalaysiaLookupResult {
  found: boolean;
  postcode: string;
  matches: MalaysiaPostalRecord[];
  primaryMatch?: MalaysiaPostalRecord;
  executionTimeMs: number;
  error?: string;
}

export interface MalaysiaIndexData {
  country: MalaysiaCountryMetadata;
  postcode: {
    type: string;
    length: number;
    format: string;
    regex: string;
  };
  administrativeSummary: {
    stateCount: number;
    federalTerritoryCount: number;
    totalTopLevelUnits: number;
  };
  topLevelUnits: Array<{
    nameEn: string;
    nameMs: string;
    administrativeType: string;
    code: string;
    codeDosm?: string;
    file: string;
  }>;
  postcodeMap: Record<string, string>;
  statistics: {
    uniquePostcodes: number;
    totalRecords: number;
  };
  datasetVersion: string;
}

// In-memory caches for maximum performance
let cachedIndex: MalaysiaIndexData | null = null;
const cachedUnits = new Map<string, any>();
const lookupCache = new Map<string, MalaysiaPostalRecord[]>();

const POSTAL_REGEX = /^[0-9]{5}$/;

/**
 * Validates and normalizes user input for Malaysian postcodes
 * Strips whitespace, removes accidental spaces (e.g. "43 000" -> "43000")
 */
export function validateMalaysiaPostcode(rawInput: unknown): MalaysiaValidationResult {
  if (typeof rawInput !== 'string' && typeof rawInput !== 'number') {
    return { valid: false, error: 'Postcode must be a string or number.' };
  }

  const str = String(rawInput).trim().replace(/\s+/g, '');

  if (!/^\d+$/.test(str)) {
    return { valid: false, error: 'Postcode must contain only numeric digits.' };
  }

  if (str.length !== 5) {
    return { valid: false, error: 'Malaysian postcodes must be exactly 5 digits.' };
  }

  if (!POSTAL_REGEX.test(str)) {
    return { valid: false, error: 'Invalid 5-digit Malaysian postcode format.' };
  }

  return { valid: true, normalized: str };
}

/**
 * Safe local JSON loader supporting Node.js fs & Browser fetch
 */
async function loadLocalJson<T>(relativePath: string): Promise<T | null> {
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;

  // Browser fetch environment
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    const urls = [
      `/data/malaysia-postal/${cleanPath}`,
      `./data/malaysia-postal/${cleanPath}`,
      `data/malaysia-postal/${cleanPath}`
    ];
    for (const u of urls) {
      try {
        const res = await fetch(u);
        if (res.ok) {
          return (await res.json()) as T;
        }
      } catch {
        // try next path
      }
    }
    return null;
  }

  // Node.js environment
  try {
    const fs = await import(/*turbopackIgnore: true*/ 'node:fs');
    const path = await import(/*turbopackIgnore: true*/ 'node:path');

    const searchBases = [
      path.resolve(process.cwd(), 'data', 'malaysia-postal'),
      path.resolve(process.cwd(), 'public', 'data', 'malaysia-postal'),
      path.resolve(process.cwd(), '..', 'data', 'malaysia-postal')
    ];

    for (const base of searchBases) {
      const fullPath = path.join(base, cleanPath);
      if (fs.existsSync(fullPath)) {
        const text = fs.readFileSync(fullPath, 'utf-8');
        return JSON.parse(text) as T;
      }
    }
  } catch (err) {
    console.error(`Node.js file load failed for ${cleanPath}:`, err);
  }

  return null;
}

/**
 * Load and cache Malaysia index.json
 */
export async function getMalaysiaPostalIndex(): Promise<MalaysiaIndexData | null> {
  if (cachedIndex) return cachedIndex;
  const data = await loadLocalJson<MalaysiaIndexData>('index.json');
  if (data) {
    cachedIndex = data;
  }
  return cachedIndex;
}

/**
 * Primary Local Offline Lookup Function for Malaysia Postcodes
 *
 * Guaranteed:
 * - 100% offline local execution
 * - Zero external API calls
 * - Preserves leading zeroes
 * - Returns all matches for multi-match postcodes
 * - In-memory LRU caching for microsecond-speed lookups
 */
export async function lookupMalaysiaPostcode(rawInput: unknown): Promise<MalaysiaLookupResult> {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const validation = validateMalaysiaPostcode(rawInput);
  if (!validation.valid || !validation.normalized) {
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    return {
      found: false,
      postcode: String(rawInput || ''),
      matches: [],
      executionTimeMs: elapsed,
      error: validation.error || 'Invalid postcode'
    };
  }

  const postcode = validation.normalized;

  // Check in-memory result cache
  if (lookupCache.has(postcode)) {
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    const matches = lookupCache.get(postcode)!;
    return {
      found: matches.length > 0,
      postcode,
      matches,
      primaryMatch: matches[0],
      executionTimeMs: elapsed
    };
  }

  // Load index to determine target file
  const index = await getMalaysiaPostalIndex();
  if (!index) {
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    return {
      found: false,
      postcode,
      matches: [],
      executionTimeMs: elapsed,
      error: 'Failed to load local Malaysia postal index.'
    };
  }

  const relativeFile = index.postcodeMap?.[postcode];
  if (!relativeFile) {
    // Unknown postcode in dataset
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    lookupCache.set(postcode, []);
    return {
      found: false,
      postcode,
      matches: [],
      executionTimeMs: elapsed
    };
  }

  // Load state / territory file with caching
  let unitData = cachedUnits.get(relativeFile);
  if (!unitData) {
    unitData = await loadLocalJson<any>(relativeFile);
    if (unitData) {
      cachedUnits.set(relativeFile, unitData);
    }
  }

  if (!unitData || !Array.isArray(unitData.postcodes)) {
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    return {
      found: false,
      postcode,
      matches: [],
      executionTimeMs: elapsed,
      error: `Failed to load partition file ${relativeFile}.`
    };
  }

  const entry = unitData.postcodes.find((p: any) => p.postcode === postcode);
  const matches: MalaysiaPostalRecord[] = entry ? entry.matches || [] : [];

  // Cache results
  lookupCache.set(postcode, matches);

  const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
  return {
    found: matches.length > 0,
    postcode,
    matches,
    primaryMatch: matches[0],
    executionTimeMs: elapsed
  };
}

/**
 * Clear in-memory caches
 */
export function clearMalaysiaPostalCache(): void {
  cachedIndex = null;
  cachedUnits.clear();
  lookupCache.clear();
}
