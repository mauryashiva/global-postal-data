/**
 * Local India Pincode Offline Lookup Utility
 * ==========================================
 * Location: data/india-pincodes/lookup.ts
 *
 * 100% Local & Offline - Zero runtime network or external API dependencies.
 *
 * Usage:
 *   import { lookupPincode, populateAddressFields, validatePincode } from './lookup';
 *
 *   const result = await lookupPincode('400001');
 *   if (result.found) {
 *     console.log(result.postOffices);
 *     const address = populateAddressFields(result.postOffices[0], result.pincode);
 *   }
 */

export interface PostOffice {
  officeName: string;
  officeType?: string;
  deliveryStatus?: string;
  circle?: string;
  region?: string;
  division?: string;
  officeId?: string;
  cityVillage?: string;
  taluk?: string;
  subDistrict?: string;
  district: string;
  state: string;
  address?: string;
  phone?: string;
  email?: string;
  validFrom?: string;
  latitude?: number;
  longitude?: number;
  relatedSubOffice?: string;
  relatedHeadOffice?: string;
}

export interface PincodeRecord {
  pincode: string;
  state: string;
  district: string;
  postOffices: PostOffice[];
}

export interface IndexStateMeta {
  name: string;
  slug: string;
  type: 'state' | 'union-territory';
  file: string;
  totalPincodes: number;
  totalPostOffices: number;
}

export interface CountryMetadata {
  country: string;
  isoAlpha2: string;
  isoAlpha3: string;
  isoNumeric: string;
  phoneCode: string;
  flag: string;
  lastUpdated: string;
  source: string;
  stats: {
    totalPostOffices: number;
    uniquePincodes: number;
    statesCount: number;
    unionTerritoriesCount: number;
  };
  states: IndexStateMeta[];
  unionTerritories: IndexStateMeta[];
  pincodeDirectory: Record<string, string>;
}

export interface PopulatedAddress {
  pincode: string;
  postOffice: string;
  area: string;
  locality: string;
  cityTown: string;
  district: string;
  talukSubDistrict: string;
  stateUT: string;
  country: string;
  officeType?: string;
  deliveryStatus?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

export interface LocalityEntry {
  defaultArea: string;
  areas: string[];
}

export type LocalitiesDirectory = Record<string, LocalityEntry>;

export interface PincodeLookupResult {
  found: boolean;
  pincode: string;
  state?: string;
  district?: string;
  country: string;
  postOffices: PostOffice[];
  areas?: string[];
  defaultArea?: string;
  error?: string;
}

// In-memory runtime caches for microsecond lookup performance
let cachedIndex: CountryMetadata | null = null;
let cachedLocalities: LocalitiesDirectory | null = null;
const stateDatasetCache = new Map<string, PincodeRecord[]>();

/**
 * Validate that a pincode is exactly 6 digits
 */
export function validatePincode(pincode: string): boolean {
  if (!pincode) return false;
  return /^\d{6}$/.test(pincode.trim());
}

/**
 * Clean and format a pincode string
 */
export function cleanPincode(pincode: string): string {
  return String(pincode || '').trim().replace(/\D/g, '').slice(0, 6);
}

/**
 * Load local JSON file based on runtime environment (Browser vs Node.js)
 */
async function loadLocalJson<T>(relativePath: string): Promise<T> {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    // Node.js / Server Environment: read directly from local filesystem
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
      path.join(process.cwd(), 'data', 'india-pincodes', relativePath),
      path.join(process.cwd(), 'public', 'data', 'india-pincodes', relativePath),
    ];

    for (const p of candidatePaths) {
      try {
        const raw = await fs.readFile(/*turbopackIgnore: true*/ p, 'utf8');
        return JSON.parse(raw) as T;
      } catch {
        // try next
      }
    }
    throw new Error(`Local postal data file not found: ${relativePath}`);
  } else {
    // Browser / Client Offline Environment: fetch local static asset
    const url = `/data/india-pincodes/${relativePath}`;
    const response = await fetch(url, {
      cache: 'force-cache',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to load local postal file: ${url} (status: ${response.status})`);
    }
    return (await response.json()) as T;
  }
}

/**
 * Load optional sub-localities / neighborhoods mapping
 */
export async function getLocalitiesMapping(): Promise<LocalitiesDirectory | null> {
  if (cachedLocalities) return cachedLocalities;
  try {
    cachedLocalities = await loadLocalJson<LocalitiesDirectory>('localities.json');
    return cachedLocalities;
  } catch {
    return null;
  }
}

/**
 * Load and cache the main index.json
 */
export async function getPincodeIndex(): Promise<CountryMetadata> {
  if (cachedIndex) return cachedIndex;
  cachedIndex = await loadLocalJson<CountryMetadata>('index.json');
  return cachedIndex;
}

/**
 * Lookup a 6-digit Pincode from local dataset.
 * Does NOT make any external network requests.
 * Loads only the relevant state/UT file and caches it.
 */
export async function lookupPincode(inputPincode: string): Promise<PincodeLookupResult> {
  const pincode = cleanPincode(inputPincode);

  if (!validatePincode(pincode)) {
    return {
      found: false,
      pincode,
      country: 'India',
      postOffices: [],
      error: 'Invalid pincode format. Must contain exactly 6 digits.',
    };
  }

  try {
    const index = await getPincodeIndex();
    const entitySlug = index.pincodeDirectory[pincode];

    if (!entitySlug) {
      return {
        found: false,
        pincode,
        country: 'India',
        postOffices: [],
        error: `Pincode ${pincode} not found in official India postal directory.`,
      };
    }

    // Determine folder (states vs union-territories)
    const isUT = index.unionTerritories.some(u => u.slug === entitySlug);
    const subfolder = isUT ? 'union-territories' : 'states';
    const relativeFilePath = `${subfolder}/${entitySlug}.json`;

    // Retrieve from state cache or load file
    let records = stateDatasetCache.get(entitySlug);
    if (!records) {
      records = await loadLocalJson<PincodeRecord[]>(relativeFilePath);
      stateDatasetCache.set(entitySlug, records);
    }

    // Find the matching pincode record
    const match = records.find(r => r.pincode === pincode);
    if (!match || !match.postOffices || match.postOffices.length === 0) {
      return {
        found: false,
        pincode,
        country: 'India',
        postOffices: [],
        error: `No post offices found for pincode ${pincode}.`,
      };
    }

    // Check optional sub-localities (e.g. 401209 -> Gokhivra, Dhaniv, Achole, Damodar Nagar, Kargil Nagar)
    const localitiesMap = await getLocalitiesMapping();
    const localityData = localitiesMap ? localitiesMap[pincode] : undefined;

    const officeAreas = Array.from(new Set(match.postOffices.map(o => extractAreaName(o.officeName)).filter(Boolean)));
    const areas = localityData?.areas && localityData.areas.length > 0
      ? localityData.areas
      : officeAreas;

    const defaultArea = localityData?.defaultArea || areas[0] || extractAreaName(match.postOffices[0].officeName);

    return {
      found: true,
      pincode: match.pincode,
      state: match.state,
      district: match.district,
      country: index.country || 'India',
      postOffices: match.postOffices,
      areas,
      defaultArea,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      found: false,
      pincode,
      country: 'India',
      postOffices: [],
      error: `Local lookup failed: ${message}`,
    };
  }
}

/**
 * Extract clean Locality / Area name from a Post Office name
 * e.g., "Nariman Point S.O" -> "Nariman Point"
 *       "Peddakotla B.O" -> "Peddakotla"
 *       "Indiranagar S.O (Bangalore)" -> "Indiranagar"
 */
export function extractAreaName(officeName: string): string {
  if (!officeName) return '';
  return officeName
    .replace(/\s+(B\.?O\.?|S\.?O\.?|H\.?O\.?|G\.?P\.?O\.?)$/i, '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || officeName;
}

/**
 * Format and populate complete address fields when user selects a Post Office & Area
 */
export function populateAddressFields(
  selectedOffice: PostOffice,
  pincode: string,
  country = 'India',
  selectedArea?: string
): PopulatedAddress {
  const defaultAreaName = extractAreaName(selectedOffice.officeName);
  const areaName = selectedArea || defaultAreaName;
  const cityTown = selectedOffice.cityVillage ||
                   selectedOffice.taluk ||
                   selectedOffice.district ||
                   areaName;

  const talukSubDistrict = selectedOffice.taluk ||
                           selectedOffice.subDistrict ||
                           selectedOffice.district;

  return {
    pincode,
    postOffice: selectedOffice.officeName,
    area: areaName,
    locality: areaName,
    cityTown,
    district: selectedOffice.district,
    talukSubDistrict,
    stateUT: selectedOffice.state,
    country,
    officeType: selectedOffice.officeType,
    deliveryStatus: selectedOffice.deliveryStatus,
    phone: selectedOffice.phone,
    latitude: selectedOffice.latitude,
    longitude: selectedOffice.longitude,
  };
}

/**
 * Clear in-memory caches (useful for testing or memory clearing)
 */
export function clearPincodeCache(): void {
  cachedIndex = null;
  cachedLocalities = null;
  stateDatasetCache.clear();
}
