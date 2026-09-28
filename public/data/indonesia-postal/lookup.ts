/**
 * Indonesia Postal Code & Administrative Offline Lookup Engine
 * ============================================================
 * Location: public/data/indonesia-postal/lookup.ts & data/indonesia-postal/lookup.ts
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. Zero Runtime External API Calls (no Pos Indonesia API, no Google Maps, no external geocoders).
 * 2. 100% offline local JSON loading using O(1) 2-digit prefix partition routing.
 * 3. In-memory LRU caching to eliminate repeated file I/O or network fetches.
 * 4. Dual-environment support (Node.js fs & Browser fetch).
 * 5. Preserves 38 Provinces with official administrative types.
 * 6. Preserves distinct Kabupaten (Regency) vs Kota (City) administrative types.
 * 7. Preserves Kecamatan (District) and Desa/Kelurahan (Village / Urban Village).
 * 8. Preserves RT / RW (Rukun Tetangga / Rukun Warga) when available.
 */

export interface IndonesiaProvince {
  code: string;
  nameEn: string;
  nameId: string;
  nameNative: string;
  administrativeType: 'Province' | string;
  specialStatus?: string | null;
}

export interface IndonesiaKabupatenKota {
  code: string;
  nameId: string;
  nameEn: string;
  administrativeType: 'Regency' | 'City' | 'Administrative City' | 'Administrative Regency' | string;
}

export interface IndonesiaDistrict {
  code: string;
  nameId: string;
  nameEn: string;
  administrativeType: 'District' | string;
}

export interface IndonesiaVillage {
  code: string;
  nameId: string;
  nameEn: string;
  administrativeType: 'Village' | 'Urban Village' | string;
}

export interface IndonesiaLocality {
  nameId: string;
  nameEn: string;
}

export interface IndonesiaPostOffice {
  nameId: string;
  nameEn: string;
  code?: string;
  type?: string;
  deliveryStatus?: string | null;
  phone?: string;
  address?: string;
}

export interface IndonesiaPostalRecord {
  postalCode: string;
  province: IndonesiaProvince;
  kabupatenKota: IndonesiaKabupatenKota;
  district: IndonesiaDistrict;
  village: IndonesiaVillage;
  locality: IndonesiaLocality;
  rt?: string | null;
  rw?: string | null;
  postOffice?: IndonesiaPostOffice | null;
  source: {
    name: string;
    url: string;
    recordId: string;
    retrievedAt: string;
    sourceUpdatedAt: string;
  };
}

export interface IndonesiaValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

export interface IndonesiaLookupResult {
  found: boolean;
  postalCode: string;
  matches: IndonesiaPostalRecord[];
  primaryMatch?: IndonesiaPostalRecord;
  executionTimeMs: number;
  error?: string;
}

export interface IndonesiaIndexData {
  country: {
    nameEn: string;
    nameId: string;
    nameNative: string;
    isoAlpha2: string;
    isoAlpha3: string;
    isoNumeric: string;
    phoneCode: string;
    currency: string;
    currencyName: string;
    flag: string;
  };
  postalCode: {
    type: string;
    length: number;
    format: string;
    regex: string;
  };
  administrativeStructure: {
    provinceCount: number;
    kabupatenCount: number;
    kotaCount: number;
    districtCount: number;
    villageCount: number;
  };
  statistics: {
    uniquePostalCodes: number;
    totalPostalRecords: number;
    totalPostOfficeRecords: number;
    provincesCount: number;
    partitionsCount: number;
  };
  partitions: string[];
}

// In-Memory LRU Cache
const partitionCache = new Map<string, { prefix: string; records: IndonesiaPostalRecord[] }>();
let cachedIndex: IndonesiaIndexData | null = null;
const MAX_CACHE_ENTRIES = 50;

/**
 * Normalizes input postal code:
 * 1. Converts to string, trims whitespace
 * 2. Removes spaces and hyphens
 * 3. Preserves leading zeros as a 5-character string
 */
export function normalizeIndonesiaPostalCode(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const clean = raw.trim().replace(/[\s-]+/g, '');
  return clean;
}

/**
 * Validates Indonesian postal code:
 * Strictly 5 numeric digits (^[0-9]{5}$)
 */
export function validateIndonesiaPostalCode(raw: string): IndonesiaValidationResult {
  const norm = normalizeIndonesiaPostalCode(raw);
  if (!/^[0-9]{5}$/.test(norm)) {
    return {
      valid: false,
      error: `Invalid postal code '${raw}'. Indonesia postal codes must be exactly 5 numeric digits (^[0-9]{5}$).`,
    };
  }
  return {
    valid: true,
    normalized: norm,
  };
}

/**
 * Load partition data dynamically in Node.js or Browser
 */
async function loadPartition(prefix: string): Promise<IndonesiaPostalRecord[]> {
  if (partitionCache.has(prefix)) {
    return partitionCache.get(prefix)!.records;
  }

  // Node.js environment
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const rootDir = process.cwd();
      const possiblePaths = [
        path.join(rootDir, 'public', 'data', 'indonesia-postal', 'postal', `${prefix}.json`),
        path.join(rootDir, 'data', 'indonesia-postal', 'postal', `${prefix}.json`),
        path.resolve('data', 'indonesia-postal', 'postal', `${prefix}.json`),
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
          const raw = fs.readFileSync(/*turbopackIgnore: true*/ p, 'utf-8');
          const parsed = JSON.parse(raw);
          const records: IndonesiaPostalRecord[] = parsed.records || [];

          if (partitionCache.size >= MAX_CACHE_ENTRIES) {
            const firstKey = partitionCache.keys().next().value;
            if (firstKey) partitionCache.delete(firstKey);
          }
          partitionCache.set(prefix, { prefix, records });
          return records;
        }
      }
    } catch {
      // Fall through to browser fetch or return empty
    }
  }

  // Browser fetch environment
  if (typeof window !== 'undefined' || typeof fetch !== 'undefined') {
    try {
      const res = await fetch(`/data/indonesia-postal/postal/${prefix}.json`);
      if (res.ok) {
        const parsed = await res.json();
        const records: IndonesiaPostalRecord[] = parsed.records || [];
        if (partitionCache.size >= MAX_CACHE_ENTRIES) {
          const firstKey = partitionCache.keys().next().value;
          if (firstKey) partitionCache.delete(firstKey);
        }
        partitionCache.set(prefix, { prefix, records });
        return records;
      }
    } catch {
      // Return empty if not reachable
    }
  }

  return [];
}

/**
 * Get Indonesia Master Index
 */
export async function getIndonesiaIndex(): Promise<IndonesiaIndexData> {
  if (cachedIndex) return cachedIndex;

  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const rootDir = process.cwd();
      const possiblePaths = [
        path.join(rootDir, 'public', 'data', 'indonesia-postal', 'index.json'),
        path.join(rootDir, 'data', 'indonesia-postal', 'index.json'),
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
          const raw = fs.readFileSync(/*turbopackIgnore: true*/ p, 'utf-8');
          cachedIndex = JSON.parse(raw);
          return cachedIndex!;
        }
      }
    } catch {
      // Fall through
    }
  }

  if (typeof window !== 'undefined' || typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/data/indonesia-postal/index.json');
      if (res.ok) {
        cachedIndex = await res.json();
        return cachedIndex!;
      }
    } catch {
      // Fall through
    }
  }

  return {
    country: {
      nameEn: 'Republic of Indonesia',
      nameId: 'Indonesia',
      nameNative: 'Republik Indonesia',
      isoAlpha2: 'ID',
      isoAlpha3: 'IDN',
      isoNumeric: '360',
      phoneCode: '+62',
      currency: 'IDR',
      currencyName: 'Indonesian Rupiah',
      flag: '🇮🇩',
    },
    postalCode: {
      type: 'numeric',
      length: 5,
      format: '#####',
      regex: '^[0-9]{5}$',
    },
    administrativeStructure: {
      provinceCount: 38,
      kabupatenCount: 416,
      kotaCount: 98,
      districtCount: 7277,
      villageCount: 83771,
    },
    statistics: {
      uniquePostalCodes: 40,
      totalPostalRecords: 45,
      totalPostOfficeRecords: 35,
      provincesCount: 38,
      partitionsCount: 43,
    },
    partitions: [],
  };
}

/**
 * Main Offline Lookup Function:
 * Resolves 5-digit Indonesian postal codes via local JSON partition files.
 * Zero external API calls.
 */
export async function lookupIndonesiaPostalCode(raw: string): Promise<IndonesiaLookupResult> {
  const start = performance.now();
  const valid = validateIndonesiaPostalCode(raw);

  if (!valid.valid || !valid.normalized) {
    const end = performance.now();
    return {
      found: false,
      postalCode: raw,
      matches: [],
      executionTimeMs: Math.round((end - start) * 100) / 100,
      error: valid.error || 'Invalid 5-digit Indonesia postal code format.',
    };
  }

  const normalized = valid.normalized;
  const prefix = normalized.slice(0, 2);
  const partitionRecords = await loadPartition(prefix);

  const matches = partitionRecords.filter((r) => r.postalCode === normalized);
  const end = performance.now();
  const executionTimeMs = Math.round((end - start) * 100) / 100;

  if (matches.length === 0) {
    return {
      found: false,
      postalCode: normalized,
      matches: [],
      executionTimeMs,
      error: `Postal code ${normalized} not found in local Indonesia dataset.`,
    };
  }

  return {
    found: true,
    postalCode: normalized,
    matches,
    primaryMatch: matches[0],
    executionTimeMs,
  };
}
