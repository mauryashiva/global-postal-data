import type { CountryConfig, UniversalPostalRecord, UniversalLookupResult, DatasetStats } from './types';
import {
  lookupChinaPostalCode,
  validateChinaPostalCode,
  cleanChinaPostalCode,
  getChinaPostalIndex,
  type ChinaPostalMatch
} from '../../../public/data/china-postal/lookup';

export const chinaConfig: CountryConfig = {
  id: 'CN',
  name: 'China',
  nativeName: '中国',
  flag: '🇨🇳',
  isoAlpha2: 'CN',
  isoAlpha3: 'CHN',
  isoNumeric: '156',
  phoneCode: '+86',
  postalCode: {
    label: 'Postal Code',
    length: 6,
    numeric: true,
    placeholder: 'e.g. 518000 or 100000',
    regex: /^[0-9]{6}$/,
    validate: validateChinaPostalCode,
    clean: cleanChinaPostalCode,
  },
  presets: [
    { code: '518000', label: 'Shenzhen', badge: 'Guangdong', description: 'Tech mega-city (Futian, Nanshan, Yantian)' },
    { code: '100000', label: 'Beijing Central', badge: 'Municipality', description: 'Capital direct municipality' },
    { code: '200000', label: 'Shanghai Central', badge: 'Municipality', description: 'Financial hub direct municipality' },
    { code: '310000', label: 'Hangzhou', badge: 'Zhejiang', description: 'E-commerce & technology capital' },
    { code: '610000', label: 'Chengdu', badge: 'Sichuan', description: 'Southwest economic hub' },
    { code: '510000', label: 'Guangzhou', badge: 'Guangdong', description: 'Greater Bay Area trade center' },
    { code: '999077', label: 'Hong Kong', badge: 'SAR', description: 'Special Administrative Region (19 districts)' },
    { code: '999078', label: 'Macao', badge: 'SAR', description: 'Special Administrative Region (9 parishes)' },
    { code: '710000', label: 'Taipei', badge: 'Taiwan Province', description: 'Cross-strait postal exchange routing' },
  ],
  fields: [
    { key: 'locality', label: 'Area / Locality', placeholder: 'Auto-populated locality or delivery office', readOnly: true, required: true, order: 1, helpText: 'Delivery office, subdistrict, or neighborhood' },
    { key: 'postOffice', label: 'Post Office / Postal Area', placeholder: 'Auto-populated postal branch', readOnly: true, required: true, order: 2 },
    { key: 'city', label: 'City', placeholder: 'Auto-populated city', readOnly: true, required: true, order: 3 },
    { key: 'prefectureCounty', label: 'Prefecture / County', placeholder: 'Auto-populated district/county', readOnly: true, required: true, order: 4 },
    { key: 'provinceRegion', label: 'Province / Region', placeholder: 'Auto-populated province', readOnly: true, required: true, order: 5 },
    { key: 'country', label: 'Country', placeholder: 'China', readOnly: true, required: true, order: 6 },
  ],
  tableColumns: [
    {
      key: 'district',
      label: 'District / County (区/县)',
      getValue: (r) => r.districtCounty,
    },
    {
      key: 'city',
      label: 'City (地级市/直辖市)',
      getValue: (r) => r.city,
    },
    {
      key: 'province',
      label: 'Province / Region (省/市)',
      getValue: (r) => r.provinceState,
    },
    {
      key: 'adminType',
      label: 'Classification',
      getValue: (r) => r.administrativeType || 'District',
      badge: (r) => ({
        text: r.administrativeType || 'District',
        variant: r.administrativeType?.includes('Municipality') ? 'info' : 'neutral',
      }),
    },
    {
      key: 'postOffice',
      label: 'Post Office (邮政局)',
      getValue: (r) => r.primaryName,
    },
    {
      key: 'adcode',
      label: 'GB/T Code',
      getValue: (r) => r.rawRecord?.prefectureCounty?.code || '—',
    },
  ],
  formatFullAddress: (record, postalCode, premises, selectedArea) => {
    const localityName = selectedArea || record.area;
    const lines = [
      premises.addressLine1.trim(),
      premises.addressLine2.trim(),
      localityName ? `Locality: ${localityName}` : '',
      `Post Office: ${record.primaryName}`,
      record.districtCounty,
      record.city !== record.provinceState ? record.city : '',
      `${record.provinceState} ${postalCode}`,
      'China (中国)',
    ].filter(Boolean);
    return lines.join('\n');
  },
  lookup: async (code: string): Promise<UniversalLookupResult> => {
    const t0 = performance.now();
    const res = await lookupChinaPostalCode(code);
    const ms = parseFloat((performance.now() - t0).toFixed(2));

    if (!res.found || !res.matches || res.matches.length === 0) {
      return {
        found: false,
        postalCode: code,
        countryName: 'China',
        records: [],
        executionTimeMs: ms,
        error: res.error || `No postal records found for code ${code}`,
      };
    }

    const universalRecords: UniversalPostalRecord[] = res.matches.map((m: ChinaPostalMatch) => {
      const countyStr = `${m.prefectureCounty.nameEn} (${m.prefectureCounty.nameZh})`;
      const cityStr = `${m.city.nameEn} (${m.city.nameZh})`;
      const provStr = `${m.provinceRegion.nameEn} (${m.provinceRegion.nameZh})`;
      const localityStr = m.locality ? `${m.locality.nameEn} (${m.locality.nameZh})` : countyStr;
      const poStr = m.postOffice ? `${m.postOffice.nameEn} (${m.postOffice.nameZh})` : `${countyStr} Post Office`;

      return {
        id: `${m.prefectureCounty.code || m.prefectureCounty.nameEn}-${code}`,
        primaryName: poStr,
        secondaryName: m.prefectureCounty.administrativeType,
        area: localityStr,
        city: cityStr,
        districtCounty: countyStr,
        provinceState: provStr,
        country: 'China',
        postalCode: code,
        officeType: m.postOffice?.type || 'Branch Post Office',
        deliveryStatus: 'Delivery',
        administrativeType: m.prefectureCounty.administrativeType,
        latitude: m.latitude,
        longitude: m.longitude,
        rawRecord: m,
      };
    });

    const distinctAreas = Array.from(new Set(universalRecords.map((r) => r.area)));

    return {
      found: true,
      postalCode: code,
      countryName: 'China',
      records: universalRecords,
      areas: distinctAreas,
      defaultArea: distinctAreas[0],
      executionTimeMs: ms,
    };
  },
  getDatasetStats: async (): Promise<DatasetStats> => {
    try {
      const index = await getChinaPostalIndex();
      return {
        countryName: 'China',
        summaryTitle: 'Official China Post & MCA Directory',
        divisionCountStr: `${index.administrativeSummary.totalProvinceLevelDivisions} Province-Level Divisions (${index.administrativeSummary.provinceCount} Provinces, ${index.administrativeSummary.autonomousRegionCount} Autonomous Regions, ${index.administrativeSummary.municipalityCount} Municipalities, ${index.administrativeSummary.specialAdministrativeRegionCount} SARs)`,
        postalCodeCountStr: `${index.statistics.uniquePostalCodes.toLocaleString()} Unique 6-Digit Codes`,
        officeCountStr: `${index.statistics.totalRecords.toLocaleString()} County & District Postal Units`,
        sourceAttribution: 'Ministry of Civil Affairs (MCA GB/T 2260), State Post Bureau (China Post), UPU',
        statusText: '100% Local JSON · 0 External APIs',
      };
    } catch {
      return {
        countryName: 'China',
        summaryTitle: 'Official China Post & MCA Directory',
        divisionCountStr: '34 Province-Level Divisions',
        postalCodeCountStr: '2,904 Unique Postal Codes',
        officeCountStr: '3,172 County & District Units',
        sourceAttribution: 'MCA GB/T 2260 & China Post',
        statusText: '100% Local JSON',
      };
    }
  },
};
