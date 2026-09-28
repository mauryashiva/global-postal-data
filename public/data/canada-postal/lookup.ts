/**
 * Canada Postal Code & Address Local Lookup Engine
 * =================================================
 * File: public/data/canada-postal/lookup.ts
 * 
 * Features:
 * - 100% Offline Local JSON Execution (Zero Runtime External APIs)
 * - Strict Canada Post validation (ANA NAN canonical display, excluded letters D, F, I, O, Q, U, W/Z first char)
 * - 10 Provinces + 3 Territories = 13 administrative divisions (SGC 2021)
 * - Preserves Postal Geography != Municipal Geography != Census Geography
 * - Full support for Rural Routes, Postal Boxes, General Delivery, LVR, Military Mail
 * - Isomorphic dual-environment support (Node.js fs & Browser fetch)
 * - In-memory Map cache for sub-microsecond resolution
 */

export interface CanadaDivision {
  code: string;
  isoCode: string;
  sgcCode: string;
  nameEn: string;
  nameFr: string;
  category: 'province' | 'territory';
  partitionFile: string;
}

export interface CanadaPostalGeography {
  postalCity: string;
  postalMunicipality: string;
}

export interface CanadaOfficialGeography {
  censusDivision: {
    name: string;
    code: string;
    type: string;
  } | null;
  censusSubdivision: {
    name: string;
    code: string;
    type: string;
  } | null;
}

export interface CanadaDeliveryInfo {
  type: string;
  deliveryMode: string;
  isUrban: boolean;
  isLargeVolumeReceiver: boolean;
  deliveryContext: string;
  ruralRoute: {
    isRuralRoute: boolean;
    routeIdentifier: string;
    station: string;
  } | null;
  postalBox: {
    isPostalBox: boolean;
    boxNumber: string;
    station: string;
  } | null;
  generalDelivery: {
    isGeneralDelivery: boolean;
    identifier: string;
    station: string;
  } | null;
}

export interface CanadaPostOffice {
  nameEn: string;
  nameFr: string;
  station: string;
  type: string;
  identifier: string;
}

export interface CanadaPostalRecord {
  postalCode: string;
  postalCodeNormalized: string;
  fsa: string;
  ldu: string;
  provinceTerritory: {
    nameEn: string;
    nameFr: string;
    code: string;
    isoCode: string;
    sgcCode: string;
  };
  postalGeography: CanadaPostalGeography;
  officialGeography: CanadaOfficialGeography;
  delivery: CanadaDeliveryInfo;
  postOffice: CanadaPostOffice | null;
  source: {
    name: string;
    recordId: string;
    sourceUrl: string;
  };
}

export interface CanadaPartitionData {
  provinceTerritory: {
    nameEn: string;
    nameFr: string;
    code: string;
    isoCode: string;
    sgcCode: string;
    category: 'province' | 'territory';
  };
  recordCount: number;
  postalRecords: CanadaPostalRecord[];
}

export interface CanadaIndexData {
  country: {
    nameEn: string;
    nameFr: string;
    isoAlpha2: string;
    isoAlpha3: string;
    isoNumeric: string;
    phoneCode: string;
    flag: string;
  };
  postalCode: {
    type: string;
    length: number;
    displayFormat: string;
    normalizedFormat: string;
    regex: string;
    excludedLetters: string[];
    excludedFirstLetters: string[];
  };
  administrativeSummary: {
    provinceCount: number;
    territoryCount: number;
    totalProvinceTerritoryCount: number;
    divisions: CanadaDivision[];
  };
  sources: Array<{
    name: string;
    url: string;
    retrievedAt: string;
    sourceUpdatedAt: string | null;
    version: string;
    license: string;
    role: string;
  }>;
  statistics: {
    uniquePostalCodes: number;
    totalRecords: number;
    fsaCount: number;
    postalBoxRecords: number;
    ruralRouteRecords: number;
    generalDeliveryRecords: number;
  };
  version: {
    datasetVersion: string;
    generatedAt: string;
    sourceRetrievedAt: string;
    sourceUpdatedAt: string;
  };
  postcodeMap: Record<
    string,
    {
      file: string;
      fsa: string;
      provinceCode: string;
      provinceNameEn: string;
      postalCity: string;
      isUrban: boolean;
    }
  >;
}

export interface CanadaLookupResult {
  found: boolean;
  postalCode: string;
  canonicalPostalCode: string;
  matches: CanadaPostalRecord[];
  executionTimeMs: number;
  error?: string;
}

// In-Memory Caches
let cachedIndex: CanadaIndexData | null = null;
const partitionCache = new Map<string, CanadaPartitionData>();
const queryResultCache = new Map<string, CanadaPostalRecord[]>();

const isBrowser = typeof window !== 'undefined';

/**
 * Validates and normalizes a Canadian 6-character alphanumeric postal code.
 * Rejects excluded letters: D, F, I, O, Q, U
 * Rejects excluded first letters: W, Z
 */
export function validateCanadaPostalCode(raw: string | number): {
  valid: boolean;
  normalized: string;
  canonical: string;
  fsa: string;
  ldu: string;
  isRural: boolean;
  error?: string;
} {
  if (raw === null || raw === undefined) {
    return { valid: false, normalized: '', canonical: '', fsa: '', ldu: '', isRural: false, error: 'Postal code is required' };
  }

  const str = String(raw).trim().toUpperCase().replace(/[\s-]+/g, '');

  if (str.length === 0) {
    return { valid: false, normalized: '', canonical: '', fsa: '', ldu: '', isRural: false, error: 'Postal code cannot be empty' };
  }

  if (str.length < 6) {
    return {
      valid: false,
      normalized: str,
      canonical: str,
      fsa: str.slice(0, 3),
      ldu: '',
      isRural: false,
      error: `Canadian postal code must be exactly 6 alphanumeric characters (currently ${str.length})`,
    };
  }

  if (str.length > 6) {
    return {
      valid: false,
      normalized: str,
      canonical: str,
      fsa: str.slice(0, 3),
      ldu: '',
      isRural: false,
      error: `Canadian postal code cannot exceed 6 characters (currently ${str.length})`,
    };
  }

  // Check forbidden letters anywhere: D, F, I, O, Q, U
  const forbiddenMatch = str.match(/[DFIOQU]/);
  if (forbiddenMatch) {
    return {
      valid: false,
      normalized: str,
      canonical: `${str.slice(0, 3)} ${str.slice(3)}`,
      fsa: str.slice(0, 3),
      ldu: str.slice(3),
      isRural: false,
      error: `Character '${forbiddenMatch[0]}' is not permitted in Canadian postal codes (Canada Post excludes D, F, I, O, Q, U)`,
    };
  }

  // Check forbidden first letters: W, Z
  if (str[0] === 'W' || str[0] === 'Z') {
    return {
      valid: false,
      normalized: str,
      canonical: `${str.slice(0, 3)} ${str.slice(3)}`,
      fsa: str.slice(0, 3),
      ldu: str.slice(3),
      isRural: false,
      error: `First character '${str[0]}' is reserved and not in use by Canada Post (W and Z are forbidden as first letters)`,
    };
  }

  // Check ANA NAN alternating structure
  const regex = /^[ABCEGHJ-NPRSTVXY][0-9][A-CEGHJ-NPR-TV-Z][0-9][A-CEGHJ-NPR-TV-Z][0-9]$/;
  if (!regex.test(str)) {
    return {
      valid: false,
      normalized: str,
      canonical: `${str.slice(0, 3)} ${str.slice(3)}`,
      fsa: str.slice(0, 3),
      ldu: str.slice(3),
      isRural: false,
      error: 'Invalid format. Canadian postal codes must strictly follow ANA NAN (e.g. K1A 0B1)',
    };
  }

  const fsa = str.slice(0, 3);
  const ldu = str.slice(3);
  const canonical = `${fsa} ${ldu}`;
  const isRural = fsa[1] === '0';

  return {
    valid: true,
    normalized: str,
    canonical,
    fsa,
    ldu,
    isRural,
  };
}

/**
 * Loads a JSON file isomorphically.
 */
async function loadJson<T>(subPath: string): Promise<T> {
  if (isBrowser) {
    const url = `/data/canada-postal/${subPath}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load ${url}: HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } else {
    const fs = await import('fs/promises');
    const path = await import('path');
    const candidatePaths = [
      path.resolve(process.cwd(), 'public', 'data', 'canada-postal', subPath),
      path.resolve(process.cwd(), 'data', 'canada-postal', subPath),
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
      throw new Error(`Local Canada postal file not found: ${subPath}`);
    }
    return JSON.parse(content) as T;
  }
}

/**
 * Retrieves the master index data.
 */
export async function getCanadaPostalIndex(): Promise<CanadaIndexData> {
  if (cachedIndex) return cachedIndex;
  cachedIndex = await loadJson<CanadaIndexData>('index.json');
  return cachedIndex;
}

/**
 * Looks up a Canadian postal code strictly offline using local partitioned JSON.
 */
export async function lookupCanadaPostalCode(rawInput: string | number): Promise<CanadaLookupResult> {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const val = validateCanadaPostalCode(rawInput);
  if (!val.valid) {
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      found: false,
      postalCode: String(rawInput || ''),
      canonicalPostalCode: val.canonical,
      matches: [],
      executionTimeMs: Math.round((t1 - t0) * 100) / 100,
      error: val.error,
    };
  }

  const norm = val.normalized;

  // 1. Check in-memory query result cache
  if (queryResultCache.has(norm)) {
    const records = queryResultCache.get(norm)!;
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      found: records.length > 0,
      postalCode: norm,
      canonicalPostalCode: val.canonical,
      matches: records,
      executionTimeMs: Math.round((t1 - t0) * 100) / 100,
    };
  }

  // 2. Load master index
  const index = await getCanadaPostalIndex();
  const mapEntry = index.postcodeMap[norm];

  if (!mapEntry) {
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      found: false,
      postalCode: norm,
      canonicalPostalCode: val.canonical,
      matches: [],
      executionTimeMs: Math.round((t1 - t0) * 100) / 100,
      error: `Postal code "${val.canonical}" not found in local Canadian dataset.`,
    };
  }

  // 3. Load partition file
  const partitionFilePath = mapEntry.file;
  let partitionData = partitionCache.get(partitionFilePath);

  if (!partitionData) {
    partitionData = await loadJson<CanadaPartitionData>(partitionFilePath);
    partitionCache.set(partitionFilePath, partitionData);
  }

  // 4. Find all matching records (handling multiple matches)
  const matches = partitionData.postalRecords.filter(
    r => r.postalCodeNormalized === norm
  );

  queryResultCache.set(norm, matches);

  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return {
    found: matches.length > 0,
    postalCode: norm,
    canonicalPostalCode: val.canonical,
    matches,
    executionTimeMs: Math.round((t1 - t0) * 100) / 100,
  };
}
