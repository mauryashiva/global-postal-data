/**
 * Multi-Country Postal & Address SaaS Architecture
 * =================================================
 * Location: src/config/countries/canada.ts
 * 
 * Canadian Postal Code & Address Engine Configuration
 * Strictly adhering to Canada Post & Statistics Canada SGC 2021 specifications.
 */

import type { CountryConfig, UniversalPostalRecord, UniversalLookupResult, DatasetStats } from './types';
import {
  lookupCanadaPostalCode,
  validateCanadaPostalCode,
  getCanadaPostalIndex,
  type CanadaPostalRecord,
} from '../../../public/data/canada-postal/lookup';

export const canadaConfig: CountryConfig = {
  id: 'CA',
  name: 'Canada',
  nativeName: 'Canada',
  flag: '🇨🇦',
  isoAlpha2: 'CA',
  isoAlpha3: 'CAN',
  isoNumeric: '124',
  phoneCode: '+1',
  postalCode: {
    label: 'Postal Code (Code postal)',
    length: 7, // ANA NAN display format
    numeric: false,
    placeholder: 'e.g. K1A 0B1, M5V 3L9, H3B 2Y5',
    regex: /^[ABCEGHJ-NPRSTVXY][0-9][A-CEGHJ-NPR-TV-Z]\s?[0-9][A-CEGHJ-NPR-TV-Z][0-9]$/i,
    validate: (val: string) => validateCanadaPostalCode(val).valid,
    clean: (val: string) => {
      const raw = String(val || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (raw.length <= 3) return raw;
      return `${raw.slice(0, 3)} ${raw.slice(3, 6)}`;
    },
  },
  presets: [
    { code: 'K1A 0B1', label: 'Parliament Hill', badge: 'ON / Ottawa', description: 'House of Commons & Library of Parliament, Ottawa ON' },
    { code: 'M5V 3L9', label: 'CN Tower & Rogers Centre', badge: 'ON / Toronto', description: 'Iconic Downtown Toronto landmark & commercial hub' },
    { code: 'H3B 2Y5', label: 'Place Ville Marie', badge: 'QC / Montréal', description: 'Premier downtown Montreal office & commercial complex' },
    { code: 'G1R 4P5', label: 'Assemblée nationale du Québec', badge: 'QC / Québec', description: 'Parliament Building of Quebec, Historic Old Quebec City' },
    { code: 'V6B 1A1', label: 'Vancouver Downtown', badge: 'BC / Vancouver', description: 'Central business & financial district, Metro Vancouver' },
    { code: 'V8W 1P5', label: 'BC Parliament Buildings', badge: 'BC / Victoria', description: 'Legislative Assembly of British Columbia, Inner Harbour Victoria' },
    { code: 'T2P 1J9', label: 'Calgary Downtown (The Bow)', badge: 'AB / Calgary', description: 'Central commercial & energy sector headquarters, Calgary AB' },
    { code: 'T5J 0N3', label: 'Edmonton City Hall', badge: 'AB / Edmonton', description: 'Sir Winston Churchill Square civic complex, Edmonton AB' },
    { code: 'R3C 1A1', label: 'Manitoba Legislative Building', badge: 'MB / Winnipeg', description: 'Provincial government complex, Broadway, Winnipeg MB' },
    { code: 'S4P 0A1', label: 'Saskatchewan Legislature', badge: 'SK / Regina', description: 'Legislative grounds and administrative centre, Regina SK' },
    { code: 'B3J 1A1', label: 'Halifax Grand Parade', badge: 'NS / Halifax', description: 'Halifax City Hall & historic civic centre, Halifax NS' },
    { code: 'E1C 1A1', label: 'Moncton Main Post Office', badge: 'NB / Moncton', description: 'Central bilingual postal routing center, Westmorland County NB' },
    { code: 'C1A 1A1', label: 'Province House', badge: 'PE / Charlottetown', description: 'Birthplace of Confederation, Historic Charlottetown PE' },
    { code: 'A1A 1A1', label: "St. John's Downtown", badge: "NL / St. John's", description: 'Capital city of Newfoundland and Labrador, Avalon Peninsula' },
    { code: 'Y1A 2B0', label: 'Yukon Legislature', badge: 'YT / Whitehorse', description: 'Yukon territorial government administration, Whitehorse YT' },
    { code: 'X1A 1A1', label: 'Yellowknife Main', badge: 'NT / Yellowknife', description: 'Territorial capital and hub of the Northwest Territories' },
    { code: 'X0A 0H0', label: 'Legislative Assembly of Nunavut', badge: 'NU / Iqaluit', description: 'Territorial assembly building, Iqaluit, Baffin Island NU' },
    { code: 'A0A 1A0', label: 'Bay Bulls (Rural Route 1)', badge: 'NL / Rural Route', description: 'Rural route delivery community on the Southern Shore' },
    { code: 'M5W 1E6', label: 'Toronto Station A (PO Box)', badge: 'ON / PO Box', description: 'Centralized postal lockbox facility, City of Toronto' },
    { code: 'K8N 5W6', label: 'CFB Trenton (8 Wing)', badge: 'ON / Military', description: 'Canadian Forces Base Trenton, Air Mobility hub' },
  ],
  fields: [
    {
      key: 'provinceTerritory',
      label: 'Province / Territory (Province / Territoire)',
      placeholder: 'e.g. Ontario, Québec, British Columbia',
      readOnly: true,
      required: true,
      order: 1,
      helpText: 'Official Canadian Province or Territory (10 Provinces & 3 Territories)',
    },
    {
      key: 'postalMunicipality',
      label: 'City / Municipality (Ville / Municipalité)',
      placeholder: 'e.g. Ottawa, Montréal, Vancouver',
      readOnly: true,
      required: true,
      order: 2,
      helpText: 'Authoritative postal municipality assigned by Canada Post',
    },
    {
      key: 'censusDivision',
      label: 'Census Division (Statistics Canada)',
      placeholder: 'County, Regional District, or Single-tier Division',
      readOnly: true,
      required: false,
      order: 3,
      helpText: 'Statistics Canada Standard Geographical Classification (SGC) Division',
    },
    {
      key: 'censusSubdivision',
      label: 'Census Subdivision (Municipal Unit)',
      placeholder: 'Official municipality or local government unit',
      readOnly: true,
      required: false,
      order: 4,
    },
    {
      key: 'postalCode',
      label: 'Postal Code (Code postal)',
      placeholder: 'e.g. K1A 0B1',
      readOnly: true,
      required: true,
      order: 5,
    },
    {
      key: 'deliveryType',
      label: 'Delivery Classification',
      placeholder: 'e.g. Letter Carrier, Rural Route, Postal Box',
      readOnly: true,
      required: false,
      order: 6,
      helpText: 'Canada Post delivery mode and service area classification',
    },
    {
      key: 'country',
      label: 'Country (Pays)',
      placeholder: 'Canada',
      readOnly: true,
      required: true,
      order: 7,
    },
  ],
  tableColumns: [
    {
      key: 'postalCity',
      label: 'City / Municipality',
      getValue: (r) => r.city,
    },
    {
      key: 'provinceTerritory',
      label: 'Province / Territory',
      getValue: (r) => r.provinceState,
      badge: (r) => {
        const provCode = r.rawRecord?.provinceTerritory?.code;
        const isTerritory = ['YT', 'NT', 'NU'].includes(provCode);
        return {
          text: `${r.provinceState} (${provCode})`,
          variant: isTerritory ? 'info' : 'success',
        };
      },
    },
    {
      key: 'censusDivision',
      label: 'Census Division',
      getValue: (r) => r.districtCounty || '—',
    },
    {
      key: 'deliveryMode',
      label: 'Delivery Mode',
      getValue: (r) => r.officeType || 'Standard',
      badge: (r) => {
        const raw = r.rawRecord?.delivery;
        if (raw?.deliveryContext === 'Military') {
          return { text: 'Military (CFPO)', variant: 'warning' };
        }
        if (raw?.isLargeVolumeReceiver) {
          return { text: 'Large User (LVR)', variant: 'info' };
        }
        if (raw?.postalBox?.isPostalBox) {
          return { text: 'PO Box Stn', variant: 'neutral' };
        }
        if (raw?.ruralRoute?.isRuralRoute) {
          return { text: 'Rural Route', variant: 'warning' };
        }
        if (raw?.generalDelivery?.isGeneralDelivery) {
          return { text: 'General Delivery', variant: 'neutral' };
        }
        return { text: raw?.isUrban ? 'Urban' : 'Rural', variant: 'success' };
      },
    },
    {
      key: 'postalCode',
      label: 'Postal Code',
      getValue: (r) => r.postalCode,
      badge: (r) => ({ text: r.postalCode, variant: 'neutral' }),
    },
  ],
  formatFullAddress: (record, postalCode, premises, selectedArea) => {
    const parts: string[] = [];

    // Line 1 & Line 2
    if (premises.addressLine1?.trim()) {
      parts.push(premises.addressLine1.trim());
    }
    if (premises.addressLine2?.trim()) {
      parts.push(premises.addressLine2.trim());
    }

    // Canada Post Domestic Addressing Standard:
    // MUNICIPALITY PROVINCE_CODE  POSTAL_CODE
    const cityName = (record.city || selectedArea || '').toUpperCase();
    const provCode = record.rawRecord?.provinceTerritory?.code || '';
    const normPostal = postalCode.toUpperCase();

    parts.push(`${cityName} ${provCode}  ${normPostal}`.trim());
    parts.push('CANADA');

    return parts.join('\n');
  },
  lookup: async (postalCode: string): Promise<UniversalLookupResult> => {
    const result = await lookupCanadaPostalCode(postalCode);

    if (!result.found || result.matches.length === 0) {
      return {
        found: false,
        postalCode,
        countryName: 'Canada',
        records: [],
        executionTimeMs: result.executionTimeMs,
        error: result.error || 'Postal code not found in local Canadian dataset.',
      };
    }

    const universalRecords: UniversalPostalRecord[] = result.matches.map((r: CanadaPostalRecord, idx: number) => {
      let classification = 'Standard';
      if (r.delivery.deliveryContext === 'Military') {
        classification = 'Military Mail';
      } else if (r.delivery.isLargeVolumeReceiver) {
        classification = 'Large Volume Receiver';
      } else if (r.delivery.postalBox?.isPostalBox) {
        classification = 'Postal Box Facility';
      } else if (r.delivery.ruralRoute?.isRuralRoute) {
        classification = `Rural Route (${r.delivery.ruralRoute.routeIdentifier})`;
      } else if (r.delivery.generalDelivery?.isGeneralDelivery) {
        classification = 'General Delivery';
      } else if (r.delivery.isUrban) {
        classification = 'Urban Letter Carrier';
      } else {
        classification = 'Rural Delivery Point';
      }

      const cdDisplay = r.officialGeography.censusDivision
        ? `${r.officialGeography.censusDivision.name} (${r.officialGeography.censusDivision.code})`
        : '';

      const csdDisplay = r.officialGeography.censusSubdivision
        ? `${r.officialGeography.censusSubdivision.name} (${r.officialGeography.censusSubdivision.type})`
        : '';

      return {
        id: `CA-${r.postalCodeNormalized}-${idx}`,
        primaryName: r.postOffice?.nameEn || r.postalGeography.postalMunicipality,
        secondaryName: r.postOffice?.nameFr !== r.postOffice?.nameEn ? r.postOffice?.nameFr : undefined,
        area: r.postOffice?.station || r.postalGeography.postalCity,
        city: r.postalGeography.postalCity,
        districtCounty: cdDisplay || csdDisplay,
        provinceState: r.provinceTerritory.nameEn,
        country: 'Canada',
        postalCode: r.postalCode,
        officeType: classification,
        deliveryStatus: r.delivery.deliveryMode,
        talukSubDistrict: csdDisplay ? `CSD: ${csdDisplay}` : undefined,
        administrativeType: `${r.provinceTerritory.nameEn} (${r.provinceTerritory.code}) · SGC ${r.provinceTerritory.sgcCode}`,
        rawRecord: r,
      };
    });

    const areas = Array.from(new Set(universalRecords.map(r => r.city)));

    return {
      found: true,
      postalCode: result.canonicalPostalCode,
      countryName: 'Canada',
      records: universalRecords,
      areas,
      defaultArea: areas[0],
      executionTimeMs: result.executionTimeMs,
    };
  },
  getDatasetStats: async (): Promise<DatasetStats> => {
    const index = await getCanadaPostalIndex();
    return {
      countryName: 'Canada',
      summaryTitle: 'Canada Post & Statistics Canada SGC Master',
      divisionCountStr: '10 Provinces & 3 Territories (13 Divisions)',
      postalCodeCountStr: `${index.statistics.uniquePostalCodes.toLocaleString()} Canonical Codes`,
      officeCountStr: `${index.statistics.totalRecords.toLocaleString()} Verified Records (${index.statistics.fsaCount} FSAs)`,
      sourceAttribution: 'Canada Post Corporation & Statistics Canada Standard Geographical Classification (SGC 2021)',
      statusText: '100% Offline Local JSON Dataset',
    };
  },
};
