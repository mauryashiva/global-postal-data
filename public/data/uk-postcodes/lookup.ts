/**
 * UK Postcode & Address Local Offline Lookup Engine
 * ==================================================
 * Location: public/data/uk-postcodes/lookup.ts & data/uk-postcodes/lookup.ts
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. Zero Runtime External API Calls (no Royal Mail, no Google Maps, no third-party APIs).
 * 2. 100% offline local JSON loading using O(1) postcode-area partition routing.
 * 3. In-memory LRU caching to eliminate repeated file I/O or network fetches.
 * 4. Dual-environment support (Node.js fs & Browser fetch).
 * 5. Preserves postal geography (Post Town, Locality) independently from administrative geography.
 * 6. Preserves constituent countries (England, Scotland, Wales, Northern Ireland).
 * 7. Identifies Crown Dependencies (Jersey, Guernsey, Isle of Man) as non-UK territories.
 * 8. Identifies BFPO (British Forces Post Office) with isBFPO: true and shipping advice.
 * 9. Supports multiple addresses per postcode without destructive overwrite.
 */

export interface UkPostcodeComponents {
  postcode: string;
  outwardCode: string;
  inwardCode: string;
  postcodeArea: string;
  postcodeDistrict: string;
  postcodeSector: string;
}

export interface UkAddressItem {
  addressId: string;
  buildingName?: string | null;
  buildingNumber?: string | null;
  subBuildingName?: string | null;
  thoroughfare?: string | null;
  dependentThoroughfare?: string | null;
  postTown: string;
  postcode: string;
  fullAddressText: string;
}

export interface UkPostalRecord {
  postcode: string;
  postcodeComponents: UkPostcodeComponents;
  postTown: string;
  locality?: string | null;
  dependentLocality?: string | null;
  constituentCountry: string;
  constituentCountryCode: string;
  region?: string | null;
  ceremonialCounty?: string | null;
  localAuthority?: string | null;
  district?: string | null;
  civilParish?: string | null;
  ward?: string | null;
  isLargeUserPostcode?: boolean;
  isPoBox?: boolean;
  poBoxNumber?: string | null;
  isBFPO?: boolean;
  bfpoNumber?: string | null;
  countryOrLocation?: string | null;
  shippingWarning?: string | null;
  isCrownDependency?: boolean;
  crownDependencyName?: string | null;
  coordinates?: {
    latitude: number;
    longitude: number;
    coordinateType: string;
  } | null;
  addresses: UkAddressItem[];
  source?: {
    sourceName: string;
    sourceRecordId: string;
    license: string;
  };
}

export interface UkAreaDataset {
  postcodeArea: string;
  recordCount: number;
  records: UkPostalRecord[];
}

export interface UkValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
  isBFPO?: boolean;
  isCrownDependency?: boolean;
}

export interface UkLookupResult {
  found: boolean;
  postcode: string;
  normalizedPostcode?: string;
  records: UkPostalRecord[];
  primaryRecord?: UkPostalRecord;
  addresses: UkAddressItem[];
  postTown?: string;
  constituentCountry?: string;
  isBFPO?: boolean;
  isCrownDependency?: boolean;
  shippingWarning?: string | null;
  executionTimeMs: number;
  error?: string;
}

export interface UkIndexData {
  country: {
    nameEn: string;
    officialNameEn: string;
    isoAlpha2: string;
    isoAlpha3: string;
    isoNumeric: string;
    phoneCode: string;
    flag: string;
  };
  constituentCountries: Array<{
    nameEn: string;
    code: string;
    type: string;
    sovereignState: string;
    capital: string;
    postcodeAreasCount: number;
  }>;
  crownDependencies: Array<{
    nameEn: string;
    isoAlpha2: string;
    isoAlpha3: string;
    isoNumeric: string;
    type: string;
    capital: string;
    postcodeArea: string;
  }>;
  statistics: {
    uniquePostcodes: number;
    totalAddressRecords: number;
    postcodeAreasCount: number;
    poBoxRecords: number;
    largeUserRecords: number;
    bfpoRecords: number;
    crownDependencyRecords: number;
    recordsByConstituentCountry: Record<string, number>;
  };
}

// In-Memory LRU Cache
const areaCache = new Map<string, UkAreaDataset>();
let cachedIndex: UkIndexData | null = null;
const MAX_CACHE_ENTRIES = 50;

/**
 * Normalizes input postcode:
 * 1. Trims leading/trailing whitespace
 * 2. Uppercases
 * 3. Removes inner spaces and hyphens
 * 4. Extracts last 3 chars as inward code, rest as outward code
 * 5. Recombines with exactly one single space
 */
export function normalizeUKPostcode(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const clean = raw.trim().toUpperCase().replace(/[\s-]+/g, '');
  if (clean.length < 5 || clean.length > 7) return clean;
  const inward = clean.slice(-3);
  const outward = clean.slice(0, -3);
  return `${outward} ${inward}`;
}

/**
 * Validates UK postcode structure:
 * Accepts:
 * A9 9AA, A99 9AA, A9A 9AA, AA9 9AA, AA99 9AA, AA9A 9AA
 * Also special BF1 9AA (BFPO) and Crown Dependencies (JE9 9AA, GY9 9AA, IM9 9AA).
 */
export function validateUKPostcode(raw: string): UkValidationResult {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, error: 'Postcode cannot be empty.' };
  }
  const normalized = normalizeUKPostcode(raw);
  if (!normalized || normalized.length < 6 || normalized.length > 8) {
    return {
      valid: false,
      normalized,
      error: `Invalid UK postcode length (${raw.trim().length} chars). Expected 6 to 8 characters with inward and outward codes.`,
    };
  }

  // Regex matching UK outward + inward pattern
  const ukRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s[0-9][A-Z]{2}$/;
  if (!ukRegex.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: `Invalid UK postcode format "${normalized}". Expected format like "SW1A 1AA", "M1 1AE", or "B33 8TH".`,
    };
  }

  const outward = normalized.split(' ')[0];
  const isBFPO = outward.startsWith('BF');
  const isCrownDependency = outward.startsWith('JE') || outward.startsWith('GY') || outward.startsWith('IM');

  return {
    valid: true,
    normalized,
    isBFPO,
    isCrownDependency,
  };
}

/**
 * Extracts postcode area (e.g. "SW", "M", "B", "EC", "BT", "EH", "CF", "JE", "BF").
 */
export function getPostcodeArea(postcode: string): string {
  const norm = normalizeUKPostcode(postcode);
  const outward = norm.split(' ')[0] || norm;
  const match = outward.match(/^[A-Z]{1,2}/);
  return match ? match[0] : '';
}

/**
 * Universal JSON loader supporting Node.js filesystem and browser fetch.
 */
async function loadUkJson<T>(subPath: string): Promise<T | null> {
  const isNode = typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node;

  if (isNode) {
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const baseDir = path.resolve(process.cwd(), 'public', 'data', 'uk-postcodes');
      const fullPath = path.join(baseDir, ...subPath.split('/'));
      if (!fs.existsSync(fullPath)) {
        // Fallback to data/uk-postcodes
        const fallbackDir = path.resolve(process.cwd(), 'data', 'uk-postcodes');
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
      console.error(`[loadUkJson] Node fs load failed for ${subPath}:`, err);
      return null;
    }
  } else {
    try {
      const url = `/data/uk-postcodes/${subPath}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch (err) {
      console.error(`[loadUkJson] Browser fetch failed for ${subPath}:`, err);
      return null;
    }
  }
}

/**
 * Returns master index with in-memory caching.
 */
export async function getUkIndex(): Promise<UkIndexData> {
  if (cachedIndex) return cachedIndex;
  const data = await loadUkJson<UkIndexData>('index.json');
  if (!data) {
    throw new Error('Failed to load local UK master index.json');
  }
  cachedIndex = data;
  return data;
}

/**
 * Loads a postcode-area partition (e.g. "sw.json", "m.json", "bt.json") with LRU cache.
 */
export async function loadPostcodeAreaDataset(postcodeArea: string): Promise<UkAreaDataset | null> {
  const areaKey = postcodeArea.toLowerCase();
  if (areaCache.has(areaKey)) {
    const data = areaCache.get(areaKey)!;
    // LRU refresh
    areaCache.delete(areaKey);
    areaCache.set(areaKey, data);
    return data;
  }

  const partition = await loadUkJson<UkAreaDataset>(`postcode-areas/${areaKey}.json`);
  if (!partition) return null;

  if (areaCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = areaCache.keys().next().value;
    if (oldestKey) areaCache.delete(oldestKey);
  }
  areaCache.set(areaKey, partition);
  return partition;
}

/**
 * Main offline lookup function for UK postcodes.
 * Guarantees zero external API calls at runtime.
 */
export async function lookupUKPostcode(rawInput: string): Promise<UkLookupResult> {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const validation = validateUKPostcode(rawInput);
  if (!validation.valid || !validation.normalized) {
    const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    return {
      found: false,
      postcode: rawInput,
      records: [],
      addresses: [],
      executionTimeMs: duration,
      error: validation.error || 'Invalid UK postcode format.',
    };
  }

  const normalized = validation.normalized;
  const area = getPostcodeArea(normalized);
  if (!area) {
    const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    return {
      found: false,
      postcode: rawInput,
      normalizedPostcode: normalized,
      records: [],
      addresses: [],
      executionTimeMs: duration,
      error: `Could not identify UK postcode area for "${normalized}".`,
    };
  }

  const dataset = await loadPostcodeAreaDataset(area);
  const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;

  if (!dataset || !dataset.records || dataset.records.length === 0) {
    return {
      found: false,
      postcode: rawInput,
      normalizedPostcode: normalized,
      records: [],
      addresses: [],
      executionTimeMs: duration,
      error: `Postcode area "${area.toUpperCase()}" not found in local UK dataset. You can continue entering the address manually.`,
    };
  }

  // Exact match search
  const matchingRecords = dataset.records.filter(r => r.postcode === normalized);

  if (matchingRecords.length === 0) {
    return {
      found: false,
      postcode: rawInput,
      normalizedPostcode: normalized,
      records: [],
      addresses: [],
      executionTimeMs: duration,
      error: `Postcode "${normalized}" not found in local UK dataset. You can continue entering the address manually.`,
    };
  }

  const primary = matchingRecords[0];
  const allAddresses: UkAddressItem[] = [];
  for (const r of matchingRecords) {
    if (r.addresses && Array.isArray(r.addresses)) {
      allAddresses.push(...r.addresses);
    }
  }

  return {
    found: true,
    postcode: rawInput,
    normalizedPostcode: normalized,
    records: matchingRecords,
    primaryRecord: primary,
    addresses: allAddresses,
    postTown: primary.postTown,
    constituentCountry: primary.constituentCountry,
    isBFPO: primary.isBFPO || false,
    isCrownDependency: primary.isCrownDependency || false,
    shippingWarning: primary.shippingWarning || null,
    executionTimeMs: duration,
  };
}
