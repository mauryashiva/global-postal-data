import type { CountryConfig, UniversalPostalRecord, UniversalLookupResult, DatasetStats } from './types';
import {
  lookupUsaPostalCode,
  validateUsaPostalCode,
  getUsaIndex,
  type UsaPostalRecord,
} from '../../../public/data/usa-postal/lookup';

export const unitedStatesConfig: CountryConfig = {
  id: 'US',
  name: 'United States',
  nativeName: 'United States',
  flag: '🇺🇸',
  isoAlpha2: 'US',
  isoAlpha3: 'USA',
  isoNumeric: '840',
  phoneCode: '+1',
  postalCode: {
    label: 'ZIP Code / ZIP+4',
    length: 5,
    numeric: true,
    placeholder: 'e.g. 10001 or 90210',
    regex: /^[0-9]{5}(-[0-9]{4})?$/,
    validate: (val: string) => validateUsaPostalCode(val).valid,
    clean: (val: string) => {
      const trimmed = (val || '').trim();
      const digits = trimmed.replace(/[^0-9]/g, '');
      if (digits.length > 5) {
        return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
      }
      return digits.slice(0, 5);
    },
  },
  presets: [
    { code: '10001', label: 'Midtown Manhattan', badge: 'New York', description: 'Empire State Building corridor & James A. Farley GPO' },
    { code: '90210', label: 'Beverly Hills', badge: 'California', description: 'Los Angeles County luxury commercial & residential sector' },
    { code: '60601', label: 'Chicago Loop', badge: 'Illinois', description: 'Central business & financial hub, Cook County' },
    { code: '33101', label: 'Miami Downtown', badge: 'Florida', description: 'Miami-Dade central postal box facility' },
    { code: '20001', label: 'Washington Capital', badge: 'District', description: 'National Capital Post Office, District of Columbia' },
    { code: '20500', label: 'The White House', badge: 'DC Unique', description: '1600 Pennsylvania Ave NW executive government facility' },
    { code: '98101', label: 'Seattle Midtown', badge: 'Washington', description: 'Downtown Seattle Pacific Northwest commercial core' },
    { code: '75001', label: 'Dallas / Addison', badge: 'Texas', description: 'North Texas technology corridor, Dallas County' },
    { code: '02108', label: 'Boston Beacon Hill', badge: 'Massachusetts', description: 'Historic Suffolk County statehouse & government sector' },
    { code: '00901', label: 'Old San Juan', badge: 'Puerto Rico', description: 'Historic Fortaleza commercial district, Puerto Rico' },
    { code: '96910', label: 'Hagåtña Capital', badge: 'Guam', description: 'Central administrative seat of Guam territory' },
    { code: '09012', label: 'Ramstein Air Base', badge: 'Military APO', description: 'Armed Forces Europe / Middle East postal gateway (AE)' },
  ],
  fields: [
    {
      key: 'stateDistrictTerritory',
      label: 'State / District / Territory',
      placeholder: 'Auto-populated state, district, or territory',
      readOnly: true,
      required: true,
      order: 1,
      helpText: 'Official State, District of Columbia, U.S. Territory, or Military jurisdiction',
    },
    {
      key: 'city',
      label: 'City / Postal City (USPS)',
      placeholder: 'Auto-populated USPS primary postal city',
      readOnly: true,
      required: true,
      order: 2,
    },
    {
      key: 'county',
      label: 'County / Parish / Municipio',
      placeholder: 'Auto-populated county (FIPS verified)',
      readOnly: true,
      required: false,
      order: 3,
    },
    {
      key: 'postalCode',
      label: 'ZIP Code',
      placeholder: '5-digit standard ZIP',
      readOnly: true,
      required: true,
      order: 4,
    },
    {
      key: 'zipPlus4',
      label: 'ZIP+4 Extension (Optional)',
      placeholder: '4-digit delivery sector extension',
      readOnly: true,
      required: false,
      order: 5,
    },
    {
      key: 'locality',
      label: 'Postal Facility / Delivery Locality',
      placeholder: 'Post office branch or local delivery area',
      readOnly: true,
      required: false,
      order: 6,
    },
    {
      key: 'country',
      label: 'Country',
      placeholder: 'United States',
      readOnly: true,
      required: true,
      order: 7,
    },
  ],
  tableColumns: [
    {
      key: 'primaryCity',
      label: 'Postal City (USPS)',
      getValue: (r) => r.city,
    },
    {
      key: 'county',
      label: 'County / Jurisdiction',
      getValue: (r) => r.districtCounty || '—',
    },
    {
      key: 'state',
      label: 'State / Territory',
      getValue: (r) => r.provinceState,
      badge: (r) => {
        const cat = r.rawRecord?.state?.category;
        const type = r.rawRecord?.state?.administrativeType;
        let variant: 'success' | 'warning' | 'info' | 'neutral' = 'neutral';
        if (cat === 'states') variant = 'success';
        else if (cat === 'district-of-columbia') variant = 'info';
        else if (cat === 'territories') variant = 'warning';
        else if (cat === 'military') variant = 'neutral';
        return {
          text: type || 'State',
          variant,
        };
      },
    },
    {
      key: 'zipType',
      label: 'ZIP Type',
      getValue: (r) => r.officeType || 'STANDARD',
      badge: (r) => {
        const type = r.officeType || 'STANDARD';
        let variant: 'success' | 'warning' | 'info' | 'neutral' = 'neutral';
        if (type === 'STANDARD') variant = 'success';
        else if (type === 'PO BOX') variant = 'warning';
        else if (type === 'UNIQUE') variant = 'info';
        else if (type === 'MILITARY') variant = 'neutral';
        return {
          text: type,
          variant,
        };
      },
    },
    {
      key: 'postalCode',
      label: 'ZIP Code',
      getValue: (r) => r.postalCode,
      badge: (r) => ({
        text: r.postalCode,
        variant: 'neutral',
      }),
    },
  ],
  formatFullAddress: (record, postalCode, premises, selectedArea) => {
    const parts: string[] = [];
    if (premises.addressLine1?.trim()) parts.push(premises.addressLine1.trim());
    if (premises.addressLine2?.trim()) parts.push(premises.addressLine2.trim());

    const cityToUse = selectedArea?.trim() || record.city;
    const stateAbbr = record.rawRecord?.state?.abbreviation || '';

    let cityStateZip = cityToUse;
    if (stateAbbr) {
      cityStateZip += `, ${stateAbbr} ${postalCode}`;
    } else {
      cityStateZip += ` ${postalCode}`;
    }
    parts.push(cityStateZip);
    parts.push('UNITED STATES');

    return parts.join('\n');
  },
  lookup: async (postalCode: string): Promise<UniversalLookupResult> => {
    const result = await lookupUsaPostalCode(postalCode);

    if (!result.found || result.records.length === 0) {
      return {
        found: false,
        postalCode,
        countryName: 'United States',
        records: [],
        executionTimeMs: result.executionTimeMs,
        error: result.error || 'ZIP Code not found in local United States dataset.',
      };
    }

    const universalRecords: UniversalPostalRecord[] = result.records.map((r: UsaPostalRecord, idx: number) => {
      const stateObj = r.state;
      const stateDisplay = `${stateObj.nameEn} (${stateObj.abbreviation})`;
      const primaryCountyName = r.primaryCounty || (r.counties && r.counties[0] ? r.counties[0].name : '');
      const countyDisplay = primaryCountyName || '—';
      const officeDisplay = r.postOffice?.name || `${r.primaryCity} Post Office`;
      const codeDisplay = r.zipPlus4 || r.zip5;

      return {
        id: `US-${r.state.abbreviation}-${r.zip5}-${idx}`,
        primaryName: officeDisplay,
        secondaryName: r.postOffice?.address,
        area: r.primaryCity,
        city: r.primaryCity,
        districtCounty: countyDisplay,
        provinceState: stateDisplay,
        country: 'United States',
        postalCode: codeDisplay,
        officeType: r.zipType,
        deliveryStatus: 'Delivery',
        phone: r.postOffice?.phone,
        talukSubDistrict: r.zcta ? `ZCTA: ${r.zcta.code}` : undefined,
        administrativeType: stateObj.administrativeType,
        latitude: r.coordinates?.latitude || null,
        longitude: r.coordinates?.longitude || null,
        rawRecord: r,
      };
    });

    return {
      found: true,
      postalCode,
      countryName: 'United States',
      records: universalRecords,
      areas: result.cityNames,
      defaultArea: result.defaultCity,
      executionTimeMs: result.executionTimeMs,
    };
  },
  getDatasetStats: async (): Promise<DatasetStats> => {
    try {
      const index = await getUsaIndex();
      return {
        countryName: 'United States',
        summaryTitle: '50 States, 1 District, 5 Territories, & Military Mail',
        divisionCountStr: `${index.administrativeSummary.totalJurisdictions} Jurisdictions (50 States, 1 DC, 5 Terr, 1 Mil)`,
        postalCodeCountStr: `${index.statistics.uniqueZip5.toLocaleString()} Unique ZIP Codes`,
        officeCountStr: `${index.statistics.totalPostOffices.toLocaleString()} Verified Postal Facilities`,
        sourceAttribution: 'USPS AIS (PostalPro) & U.S. Census Bureau 2026 Gazetteer',
        statusText: '100% Offline Local Intelligence',
      };
    } catch {
      return {
        countryName: 'United States',
        summaryTitle: '50 States & Island Territories',
        divisionCountStr: '57 Jurisdictions',
        postalCodeCountStr: '113 Unique ZIP Codes',
        officeCountStr: '113 Verified Facilities',
        sourceAttribution: 'USPS AIS & U.S. Census Bureau',
        statusText: '100% Local Dataset',
      };
    }
  },
};
