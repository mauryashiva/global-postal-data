import type { CountryConfig, UniversalPostalRecord, UniversalLookupResult, DatasetStats } from './types';
import {
  lookupMalaysiaPostcode,
  validateMalaysiaPostcode,
  getMalaysiaPostalIndex,
  type MalaysiaPostalRecord,
} from '../../../public/data/malaysia-postal/lookup';

export const malaysiaConfig: CountryConfig = {
  id: 'MY',
  name: 'Malaysia',
  nativeName: 'Malaysia',
  flag: '🇲🇾',
  isoAlpha2: 'MY',
  isoAlpha3: 'MYS',
  isoNumeric: '458',
  phoneCode: '+60',
  postalCode: {
    label: 'Postcode (Poskod)',
    length: 5,
    numeric: true,
    placeholder: '5 digits (e.g. 43000, 50450, 01000)',
    regex: /^[0-9]{5}$/,
    validate: (val: string) => validateMalaysiaPostcode(val).valid,
    clean: (val: string) => val.trim().replace(/\s+/g, '').slice(0, 5),
  },
  presets: [
    { code: '43000', label: 'Kajang', badge: 'Selangor / Hulu Langat', description: 'Kajang Town, Hulu Langat District, Selangor' },
    { code: '50450', label: 'KLCC Golden Triangle', badge: 'Federal Territory', description: 'Petronas Twin Towers & Jalan Ampang, Kuala Lumpur' },
    { code: '62000', label: 'Putrajaya Precinct 1', badge: 'Federal Territory', description: 'Perdana Putra & Federal Government Administrative Complex' },
    { code: '01000', label: 'Kangar', badge: 'Perlis (Leading Zero)', description: 'State Capital of Perlis (Northern Peninsular)' },
    { code: '05000', label: 'Alor Setar', badge: 'Kedah / Kota Setar', description: 'State Capital of Kedah, Kota Setar District' },
    { code: '10000', label: 'George Town', badge: 'Penang / Timur Laut', description: 'UNESCO World Heritage Historic City, Pulau Pinang' },
    { code: '15000', label: 'Kota Bharu', badge: 'Kelantan / Jajahan', description: 'Jajahan Kota Bharu, Royal Capital of Kelantan' },
    { code: '20000', label: 'Kuala Terengganu', badge: 'Terengganu / Coastal', description: 'State Capital & Royal Seat of Terengganu' },
    { code: '25000', label: 'Kuantan', badge: 'Pahang / Capital', description: 'State Capital of Pahang, Teluk Cempedak' },
    { code: '30000', label: 'Ipoh Old Town', badge: 'Perak / Kinta', description: 'State Capital of Perak, Kinta Valley' },
    { code: '70000', label: 'Seremban', badge: 'Negeri Sembilan', description: 'State Capital of Negeri Sembilan' },
    { code: '75000', label: 'Bandar Melaka', badge: 'Melaka / Tengah', description: 'Historic City of Melaka, Melaka Tengah District' },
    { code: '80000', label: 'Johor Bahru Central', badge: 'Johor / Capital', description: 'State Capital of Johor, Sultan Ibrahim Building' },
    { code: '84300', label: 'Bukit Pasir / Muar', badge: 'Johor / Multi-Match', description: 'Demonstrates multi-locality preservation (Bukit Pasir vs Muar)' },
    { code: '87000', label: 'Victoria', badge: 'W.P. Labuan', description: 'International Offshore Financial Centre (IBFC)' },
    { code: '88000', label: 'Kota Kinabalu', badge: 'Sabah / Capital', description: 'State Capital of Sabah, Mount Kinabalu Gateway' },
    { code: '93000', label: 'Kuching Waterfront', badge: 'Sarawak / Capital', description: 'State Capital of Sarawak, Kuching Division' },
  ],
  fields: [
    {
      key: 'state',
      label: 'State / Federal Territory (Negeri / Wilayah)',
      placeholder: 'State (13 States) or Federal Territory (3 FT)',
      readOnly: true,
      required: true,
      order: 1,
      helpText: 'Official 1st-level administrative division (13 States + 3 Federal Territories)',
    },
    {
      key: 'district',
      label: 'District / Administrative Area (Daerah / Jajahan)',
      placeholder: 'District (Daerah) or Jajahan (Kelantan)',
      readOnly: true,
      required: true,
      order: 2,
      helpText: 'Second-level administrative unit (Daerah in States, Jajahan in Kelantan)',
    },
    {
      key: 'cityTown',
      label: 'City / Town (Bandar / Pekan)',
      placeholder: 'City, Town, or Principal Locality',
      readOnly: true,
      required: true,
      order: 3,
      helpText: 'City or town associated with the postal code delivery route',
    },
    {
      key: 'subDistrict',
      label: 'Sub-District / Mukim (Mukim)',
      placeholder: 'Mukim or Administrative Sub-District',
      readOnly: true,
      required: false,
      order: 4,
      helpText: 'Third-level sub-district or Mukim tier',
    },
    {
      key: 'postcode',
      label: 'Postcode (Poskod)',
      placeholder: '5-digit numeric postcode',
      readOnly: true,
      required: true,
      order: 5,
    },
    {
      key: 'locality',
      label: 'Post Office / Area (Pejabat Pos / Kawasan)',
      placeholder: 'Pos Malaysia delivery branch or delivery locality',
      readOnly: true,
      required: false,
      order: 6,
    },
    {
      key: 'country',
      label: 'Country',
      placeholder: 'Malaysia',
      readOnly: true,
      required: true,
      order: 7,
    },
  ],
  tableColumns: [
    {
      key: 'locality',
      label: 'City / Locality (Bandar)',
      getValue: (r) => r.city || r.primaryName,
    },
    {
      key: 'district',
      label: 'District / Jajahan',
      getValue: (r) => r.districtCounty || '—',
      badge: (r) => {
        const isJajahan = r.administrativeType === 'Jajahan';
        const isFT = r.administrativeType === 'Federal Territory';
        return {
          text: isJajahan ? 'Jajahan (Kelantan)' : isFT ? 'Federal Territory' : 'District (Daerah)',
          variant: isJajahan ? 'warning' : isFT ? 'info' : 'neutral',
        };
      },
    },
    {
      key: 'state',
      label: 'State / Territory (Negeri)',
      getValue: (r) => r.provinceState,
      badge: (r) => ({
        text: r.provinceState,
        variant: 'neutral',
      }),
    },
    {
      key: 'postalCode',
      label: 'Poskod',
      getValue: (r) => r.postalCode,
      badge: (r) => ({
        text: r.postalCode,
        variant: 'neutral',
      }),
    },
  ],
  formatFullAddress: (record, postalCode, premises, selectedArea) => {
    const raw = record.rawRecord as MalaysiaPostalRecord;
    const parts: string[] = [];

    if (premises.addressLine1?.trim()) parts.push(premises.addressLine1.trim());
    if (premises.addressLine2?.trim()) parts.push(premises.addressLine2.trim());

    const localityStr = selectedArea || raw?.locality?.nameMs || record.area;
    if (localityStr && localityStr !== raw?.city?.nameMs) {
      parts.push(localityStr);
    }

    const cityStr = (raw?.city?.nameMs || record.city || '').toUpperCase();
    const stateStr = (raw?.administrativeArea?.nameMs || record.provinceState || '').toUpperCase();
    parts.push(`${postalCode} ${cityStr}`);
    parts.push(stateStr);
    parts.push('MALAYSIA');

    return parts.join('\n');
  },
  lookup: async (postalCode: string): Promise<UniversalLookupResult> => {
    const result = await lookupMalaysiaPostcode(postalCode);

    if (!result.found || result.matches.length === 0) {
      return {
        found: false,
        postalCode,
        countryName: 'Malaysia',
        records: [],
        executionTimeMs: result.executionTimeMs,
        error: result.error || 'Postcode not found in local Malaysia dataset.',
      };
    }

    const universalRecords: UniversalPostalRecord[] = result.matches.map((r: MalaysiaPostalRecord, idx: number) => {
      const cityName = r.city.nameEn;
      const districtName = r.district.nameEn;
      const stateName = r.administrativeArea.nameEn;

      return {
        id: `MY-${r.administrativeArea.code}-${r.postcode}-${idx}`,
        primaryName: cityName,
        secondaryName: `${districtName}, ${stateName}`,
        area: cityName,
        city: cityName,
        districtCounty: districtName,
        provinceState: stateName,
        country: 'Malaysia',
        postalCode: r.postcode,
        officeType: r.postOffice?.type || 'Delivery Area',
        deliveryStatus: r.postOffice?.deliveryStatus || 'Active Delivery Zone',
        talukSubDistrict: r.subDistrict.nameEn,
        administrativeType: r.district.administrativeType,
        rawRecord: r,
      };
    });

    const areaNames = universalRecords.map((r) => r.area);

    return {
      found: true,
      postalCode: result.postcode,
      countryName: 'Malaysia',
      records: universalRecords,
      areas: areaNames.length > 0 ? areaNames : [universalRecords[0].area],
      defaultArea: areaNames[0] || '',
      executionTimeMs: result.executionTimeMs,
    };
  },
  getDatasetStats: async (): Promise<DatasetStats> => {
    try {
      const index = await getMalaysiaPostalIndex();
      const stats = index?.statistics;
      const uniquePc = stats?.uniquePostcodes || 2928;
      const totalRec = stats?.totalRecords || 2932;
      return {
        countryName: 'Malaysia',
        summaryTitle: '13 States, 3 Federal Territories & 5-Digit Postcodes',
        divisionCountStr: '16 Top-Level Units (13 States + 3 Federal Territories)',
        postalCodeCountStr: `${uniquePc.toLocaleString()} Verified 5-Digit Postcodes`,
        officeCountStr: `${totalRec.toLocaleString()} Delivery Zones & Localities`,
        sourceAttribution: 'MCMC, DOSM & Pos Malaysia',
        statusText: '100% Offline Local Intelligence',
      };
    } catch {
      return {
        countryName: 'Malaysia',
        summaryTitle: '13 States, 3 Federal Territories & 5-Digit Postcodes',
        divisionCountStr: '16 Top-Level Units',
        postalCodeCountStr: '2,928 Verified Postcodes',
        officeCountStr: '2,932 Delivery Zones',
        sourceAttribution: 'MCMC, DOSM & Pos Malaysia',
        statusText: '100% Local Dataset',
      };
    }
  },
};
