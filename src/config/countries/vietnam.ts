import type { CountryConfig, UniversalPostalRecord, UniversalLookupResult, DatasetStats } from './types';
import {
  lookupVietnamPostalCode,
  validateVietnamPostalCode,
  getVietnamPostalIndex,
  type VietnamPostalRecord,
} from '../../../public/data/vietnam-postal/lookup';

export const vietnamConfig: CountryConfig = {
  id: 'VN',
  name: 'Vietnam',
  nativeName: 'Việt Nam',
  flag: '🇻🇳',
  isoAlpha2: 'VN',
  isoAlpha3: 'VNM',
  isoNumeric: '704',
  phoneCode: '+84',
  postalCode: {
    label: 'National Postal Code (Mã bưu chính quốc gia)',
    length: 5,
    numeric: true,
    placeholder: '5 digits (e.g. 10000, 70000, 01318)',
    regex: /^[0-9]{5}$/,
    validate: (val: string) => validateVietnamPostalCode(val).valid,
    clean: (val: string) => val.trim().replace(/[\s-]+/g, '').slice(0, 5),
  },
  presets: [
    { code: '10000', label: 'Hà Nội Central (Bờ Hồ)', badge: 'Central Gov City / Capital', description: 'Hanoi Central Post Office & Hoàn Kiếm Lake, National Capital' },
    { code: '11120', label: 'Ba Đình Ward (Hà Nội)', badge: 'Central Gov City / Ward', description: 'Ba Đình Administrative District, Political Core of Vietnam' },
    { code: '70000', label: 'TP. Hồ Chí Minh Central (Sài Gòn)', badge: 'Central Gov City / Sài Gòn', description: 'Saigon Central Post Office (Số 2 Công xã Paris), Financial Hub' },
    { code: '48000', label: 'Đà Nẵng Central (Bạch Đằng)', badge: 'Central Gov City / Coastal', description: 'Da Nang Central Post Office, Central Vietnam Economic Hub' },
    { code: '53000', label: 'Huế Central (Hoàng Hoa Thám)', badge: 'Central Gov City / Heritage', description: 'Historic Imperial Capital, Centrally Governed City of Huế' },
    { code: '18000', label: 'Hải Phòng Central', badge: 'Central Gov City / Port', description: 'Major Northern Deepwater Seaport & Industrial Center' },
    { code: '90000', label: 'Cần Thơ Central (Hòa Bình)', badge: 'Central Gov City / Delta', description: 'Capital of the Mekong Delta Region, Ninh Kiều' },
    { code: '01318', label: 'Đặc khu Vân Đồn', badge: 'Special Zone (Leading Zero)', description: 'Vân Đồn Special Administrative Zone, Quảng Ninh' },
    { code: '92516', label: 'Đặc khu Phú Quốc', badge: 'Special Zone / Pearl Island', description: 'Phú Quốc Special Administrative Zone, Gulf of Thailand' },
    { code: '78807', label: 'Đặc khu Côn Đảo', badge: 'Special Zone / Archipelago', description: 'Côn Đảo National Island Marine Park & Historical Zone' },
    { code: '67114', label: 'Bình Phước (Đồng Nai)', badge: 'Province / Ward', description: 'Đồng Nai Province (Reorganized under Resolution 202/2025/QH15)' },
    { code: '10298', label: 'Đại sứ quán Nga', badge: 'Diplomatic Mission', description: 'Embassy of the Russian Federation in Vietnam, Ba Đình, Hà Nội' },
    { code: '10340', label: 'Đại sứ quán Hoa Kỳ', badge: 'Diplomatic Mission', description: 'Embassy of the United States in Vietnam, Láng Hạ, Hà Nội' },
    { code: '10020', label: 'Văn phòng Chủ tịch nước', badge: 'Government Org', description: 'Office of the President of the Socialist Republic of Vietnam' },
  ],
  fields: [
    {
      key: 'provinceRegion',
      label: 'Province / City (Tỉnh / Thành phố)',
      placeholder: 'Provincial Level (34 Units: 28 Provinces / 6 Cities)',
      readOnly: true,
      required: true,
      order: 1,
      helpText: 'Current Level 1: 34 Units (28 Provinces + 6 Centrally Governed Cities)',
    },
    {
      key: 'communeWard',
      label: 'Commune / Ward / Special Zone (Xã / Phường / Đặc khu)',
      placeholder: 'Commune Level (3,321 Official Units)',
      readOnly: true,
      required: true,
      order: 2,
      helpText: 'Current Level 2: 3,321 Units (Wards, Communes, Special Administrative Zones)',
    },
    {
      key: 'postalCode',
      label: 'National Postal Code (Mã bưu chính quốc gia)',
      placeholder: '5-digit numeric postal code',
      readOnly: true,
      required: true,
      order: 3,
      helpText: 'Decision 2334/QĐ-BKHCN dated 24 August 2025',
    },
    {
      key: 'postalArea',
      label: 'Postal Area / Object (Khu vực / Đối tượng Bưu chính)',
      placeholder: 'Assigned postal delivery object or public post office',
      readOnly: true,
      required: false,
      order: 4,
    },
    {
      key: 'legacyDistrict',
      label: 'Historical District [pre-2025] (Quận / Huyện [Trước 2025])',
      placeholder: 'Legacy district retained for historical address records',
      readOnly: true,
      required: false,
      order: 5,
      helpText: 'Eliminated effective 1 July 2025 under 2-tier model; preserved for address history',
    },
    {
      key: 'country',
      label: 'Country (Quốc gia)',
      placeholder: 'Vietnam (Việt Nam)',
      readOnly: true,
      required: true,
      order: 6,
    },
  ],
  tableColumns: [
    {
      key: 'locality',
      label: 'Commune / Ward / Postal Object',
      getValue: (r) => r.primaryName,
    },
    {
      key: 'administrativeUnit',
      label: 'Classification',
      getValue: (r) => r.officeType || 'Commune Level',
      badge: (r) => {
        const isSpecialZone = r.officeType === 'Special Administrative Zone';
        const isCity = r.administrativeType === 'Centrally Governed City';
        const isGov = r.officeType?.includes('Government') || r.officeType?.includes('Diplomatic');
        return {
          text: isSpecialZone ? 'Special Zone (Đặc khu)' : isGov ? 'Special Object' : r.officeType || 'Commune',
          variant: isSpecialZone ? 'warning' : isCity ? 'info' : 'neutral',
        };
      },
    },
    {
      key: 'provinceCity',
      label: 'Province / City (Tỉnh / Thành phố)',
      getValue: (r) => r.provinceState,
      badge: (r) => ({
        text: r.administrativeType === 'Centrally Governed City' ? 'Centrally Governed City' : 'Province',
        variant: r.administrativeType === 'Centrally Governed City' ? 'info' : 'neutral',
      }),
    },
    {
      key: 'postalCode',
      label: 'Mã bưu chính',
      getValue: (r) => r.postalCode,
      badge: (r) => ({
        text: r.postalCode,
        variant: 'neutral',
      }),
    },
  ],
  formatFullAddress: (record, postalCode, premises, selectedArea) => {
    const raw = record.rawRecord as VietnamPostalRecord;
    const parts: string[] = [];

    if (premises.addressLine1?.trim()) parts.push(premises.addressLine1.trim());
    if (premises.addressLine2?.trim()) parts.push(premises.addressLine2.trim());

    const communeStr = selectedArea || raw?.commune?.fullNameVi || raw?.commune?.nameVi || record.area;
    if (communeStr) {
      parts.push(communeStr);
    }

    const provinceCityStr = (raw?.provinceRegion?.fullNameVi || raw?.provinceRegion?.nameVi || record.provinceState || '').toUpperCase();
    parts.push(`${postalCode} ${provinceCityStr}`);
    parts.push('VIETNAM');

    return parts.join('\n');
  },
  lookup: async (postalCode: string): Promise<UniversalLookupResult> => {
    const result = await lookupVietnamPostalCode(postalCode);

    if (!result.found || result.matches.length === 0) {
      return {
        found: false,
        postalCode,
        countryName: 'Vietnam',
        records: [],
        executionTimeMs: result.executionTimeMs,
        error: result.error || 'Postal code not found in local Vietnam dataset.',
      };
    }

    const universalRecords: UniversalPostalRecord[] = result.matches.map((r: VietnamPostalRecord, idx: number) => {
      const isPostalObject = r.postalObject && r.postalObject.type !== 'Ward' && r.postalObject.type !== 'Commune' && r.postalObject.type !== 'Special Administrative Zone';
      const primaryTitle = isPostalObject ? r.postalObject.nameVi : (r.commune.fullNameVi || r.commune.nameVi);
      const secondaryDesc = isPostalObject
        ? `${r.postalObject.type} · ${r.provinceRegion.fullNameVi}`
        : `${r.provinceRegion.fullNameVi} (${r.provinceRegion.administrativeType})`;

      const legacyDistrictText = r.legacyAdministrativeData
        ? `${r.legacyAdministrativeData.districtFullName} [pre-2025]`
        : undefined;

      return {
        id: `VN-${r.provinceRegion.officialCode}-${r.postalCode}-${idx}`,
        primaryName: primaryTitle,
        secondaryName: secondaryDesc,
        area: r.commune.fullNameVi || r.commune.nameVi,
        city: r.provinceRegion.nameVi,
        districtCounty: r.legacyAdministrativeData ? r.legacyAdministrativeData.districtFullName : r.provinceRegion.nameVi,
        provinceState: r.provinceRegion.nameVi,
        country: 'Vietnam',
        postalCode: r.postalCode,
        officeType: r.postalObject?.type || r.commune?.administrativeType || 'Commune',
        deliveryStatus: 'Active Postal Routing Object',
        talukSubDistrict: legacyDistrictText,
        administrativeType: r.provinceRegion.administrativeType,
        rawRecord: r,
      };
    });

    const areaNames = universalRecords.map((r) => r.primaryName);

    return {
      found: true,
      postalCode: result.postalCode,
      countryName: 'Vietnam',
      records: universalRecords,
      areas: areaNames.length > 0 ? areaNames : [universalRecords[0].primaryName],
      defaultArea: areaNames[0] || '',
      executionTimeMs: result.executionTimeMs,
    };
  },
  getDatasetStats: async (): Promise<DatasetStats> => {
    try {
      const index = await getVietnamPostalIndex();
      const stats = index?.statistics;
      const uniquePc = stats?.uniquePostalCodes || 3335;
      const totalRec = stats?.totalPostalRecords || 3335;
      return {
        countryName: 'Vietnam',
        summaryTitle: '2-Tier Model: 34 Provinces/Cities & 3,321 Communes/Wards',
        divisionCountStr: '34 Provincial-Level Units (28 Provinces + 6 Centrally Governed Cities)',
        postalCodeCountStr: `${uniquePc.toLocaleString()} Verified 5-Digit National Postal Codes`,
        officeCountStr: `${totalRec.toLocaleString()} Communes, Wards & Special Postal Objects`,
        sourceAttribution: 'MOST (Decision 2334/QĐ-BKHCN), GSO & VNPost',
        statusText: '100% Offline Local Intelligence',
      };
    } catch {
      return {
        countryName: 'Vietnam',
        summaryTitle: '2-Tier Model: 34 Provinces/Cities & 3,321 Communes/Wards',
        divisionCountStr: '34 Provincial-Level Units',
        postalCodeCountStr: '3,335 Verified Postal Codes',
        officeCountStr: '3,321 Communes/Wards + Special Postal Objects',
        sourceAttribution: 'MOST & VNPost (Decision 2334/QĐ-BKHCN)',
        statusText: '100% Local Dataset',
      };
    }
  },
};
