import type { CountryConfig, UniversalPostalRecord, UniversalLookupResult, DatasetStats } from './types';
import {
  lookupJapanPostalCode,
  validateJapanPostalCode,
  normalizeJapanPostalCode,
  formatJapanPostalCode,
  getJapanIndex,
  type JapanPostalRecord,
  type JapanAreaPostalRecord,
  type JapanBusinessPostalRecord,
} from '../../../public/data/japan-postal/lookup';

export const japanConfig: CountryConfig = {
  id: 'JP',
  name: 'Japan',
  nativeName: '日本',
  flag: '🇯🇵',
  isoAlpha2: 'JP',
  isoAlpha3: 'JPN',
  isoNumeric: '392',
  phoneCode: '+81',
  postalCode: {
    label: 'Postal Code (郵便番号)',
    length: 7,
    numeric: true,
    placeholder: 'XXX-XXXX (e.g. 100-0001)',
    regex: /^[0-9]{3}-?[0-9]{4}$/,
    validate: (val: string) => validateJapanPostalCode(val).valid,
    clean: (val: string) => val.replace(/[\u3000\u2212\uFF0D]/g, '-').replace(/[^\d-]/g, '').slice(0, 8),
  },
  presets: [
    { code: '100-0001', label: 'Imperial Palace', badge: 'Tokyo / Chiyoda', description: 'Chiyoda, Imperial Palace grounds (皇居)' },
    { code: '100-0005', label: 'Tokyo Station / Marunouchi', badge: 'Tokyo / Chiyoda', description: 'Marunouchi central financial core (丸の内)' },
    { code: '100-0013', label: 'Kasumigaseki Ministries', badge: 'Tokyo / Chiyoda', description: 'Central Government Ministries Quarter (霞が関)' },
    { code: '105-0011', label: 'Tokyo Tower', badge: 'Tokyo / Minato', description: 'Shibakoen parkland & Tokyo Tower (芝公園)' },
    { code: '150-0002', label: 'Shibuya Crossing', badge: 'Tokyo / Shibuya', description: 'Shibuya commercial district & Scramble (渋谷)' },
    { code: '160-0023', label: 'Tokyo Gov Building', badge: 'Tokyo / Shinjuku', description: 'Tokyo Metropolitan Government (西新宿・都庁)' },
    { code: '060-0001', label: 'Hokkaido Gov Office', badge: 'Hokkaido / Sapporo', description: 'Kita-Ichijo-Nishi, Sapporo Chuo Ward (北一条西)' },
    { code: '604-8571', label: 'Kyoto City Hall', badge: 'Kyoto / Nakagyo', description: 'Teramachi-dori, Nakagyo Ward (寺町通)' },
    { code: '530-0001', label: 'Umeda Commercial Hub', badge: 'Osaka / Kita Ward', description: 'JR Osaka Station & Umeda commercial center (梅田)' },
    { code: '220-0012', label: 'Minatomirai Tower', badge: 'Kanagawa / Yokohama', description: 'Yokohama Landmark Tower & Pacifico (みなとみらい)' },
    { code: '900-0014', label: 'Kokusai Dori', badge: 'Okinawa / Naha', description: 'Matsuo central shopping boulevard, Naha (松尾)' },
    { code: '100-8994', label: 'Japan Post HQ', badge: 'Business Code', description: 'Japan Post Co., Ltd. headquarters (日本郵便 本社)' },
  ],
  fields: [
    {
      key: 'prefecture',
      label: 'Prefecture (都道府県)',
      placeholder: 'Prefecture name (To/Do/Fu/Ken)',
      readOnly: true,
      required: true,
      order: 1,
      helpText: 'First-level administrative division: To (Tokyo), Do (Hokkaido), Fu (Kyoto/Osaka), or Ken',
    },
    {
      key: 'cityMunicipality',
      label: 'City / Municipality (市区町村)',
      placeholder: 'City, Special Ward, Town, or Village',
      readOnly: true,
      required: true,
      order: 2,
    },
    {
      key: 'wardCounty',
      label: 'Ward / County (区 / 郡)',
      placeholder: 'Administrative ward or district county',
      readOnly: true,
      required: false,
      order: 3,
    },
    {
      key: 'townArea',
      label: 'Town / Area (町域)',
      placeholder: 'Town or neighborhood area',
      readOnly: true,
      required: true,
      order: 4,
    },
    {
      key: 'postalCode',
      label: 'Postal Code (郵便番号)',
      placeholder: '7-digit postal code (XXX-XXXX)',
      readOnly: true,
      required: true,
      order: 5,
    },
    {
      key: 'buildingApartment',
      label: 'Building / Apartment / Room (番地・建物名・号室)',
      placeholder: 'Chome, Banchi, Building name, Floor, Room number',
      readOnly: false,
      required: false,
      order: 6,
      helpText: 'User-entered building name, banchi, floor or apartment number',
    },
    {
      key: 'country',
      label: 'Country',
      placeholder: 'Japan',
      readOnly: true,
      required: true,
      order: 7,
    },
  ],
  tableColumns: [
    {
      key: 'townArea',
      label: 'Town / Area (町域)',
      getValue: (r) => r.primaryName,
    },
    {
      key: 'municipality',
      label: 'Municipality (市区町村)',
      getValue: (r) => r.city,
    },
    {
      key: 'prefecture',
      label: 'Prefecture (都道府県)',
      getValue: (r) => r.provinceState,
      badge: (r) => {
        const type = r.administrativeType;
        let variant: 'success' | 'warning' | 'info' | 'neutral' = 'neutral';
        if (type === 'To') variant = 'info';
        else if (type === 'Do') variant = 'warning';
        else if (type === 'Fu') variant = 'success';
        else if (type === 'Ken') variant = 'neutral';
        return { text: `${r.provinceState} (${type || 'Ken'})`, variant };
      },
    },
    {
      key: 'type',
      label: 'Type',
      getValue: (r) => r.officeType || 'AREA',
      badge: (r) => {
        const isBiz = r.officeType === 'BUSINESS';
        return {
          text: isBiz ? 'Business (大口事業所)' : 'Area (一般町域)',
          variant: isBiz ? 'warning' : 'success',
        };
      },
    },
    {
      key: 'postalCode',
      label: 'Postal Code',
      getValue: (r) => formatJapanPostalCode(r.postalCode),
      badge: (r) => ({ text: formatJapanPostalCode(r.postalCode), variant: 'neutral' }),
    },
  ],
  formatFullAddress: (record, postalCode, premises, selectedArea) => {
    const raw = record.rawRecord;
    const formattedCode = formatJapanPostalCode(postalCode);

    if (raw?.postalCodeType === 'BUSINESS') {
      const biz = raw as JapanBusinessPostalRecord;
      const parts: string[] = [];
      parts.push(`〒${formattedCode}`);
      parts.push(biz.addressLineJa);
      parts.push(biz.businessNameJa);
      if (premises.addressLine1?.trim()) parts.push(premises.addressLine1.trim());
      if (premises.addressLine2?.trim()) parts.push(premises.addressLine2.trim());
      parts.push('JAPAN (日本)');
      return parts.join('\n');
    }

    const prefJa = raw?.prefectureNameJa || record.provinceState;
    const muniJa = raw?.municipality?.nameJa || record.city;
    const townJa = selectedArea || raw?.townArea?.nameJa || record.area;

    const parts: string[] = [];
    parts.push(`〒${formattedCode}`);
    parts.push(`${prefJa}${muniJa}${townJa}`);
    if (premises.addressLine1?.trim()) parts.push(premises.addressLine1.trim());
    if (premises.addressLine2?.trim()) parts.push(premises.addressLine2.trim());
    parts.push('JAPAN (日本)');

    return parts.join('\n');
  },
  lookup: async (postalCode: string): Promise<UniversalLookupResult> => {
    const result = await lookupJapanPostalCode(postalCode);

    if (!result.found || result.matches.length === 0) {
      return {
        found: false,
        postalCode: formatJapanPostalCode(postalCode),
        countryName: 'Japan',
        records: [],
        executionTimeMs: result.executionTimeMs,
        error: result.error || 'Postal code not found in local Japan dataset.',
      };
    }

    const universalRecords: UniversalPostalRecord[] = result.matches.map((r: JapanPostalRecord, idx: number) => {
      if (r.postalCodeType === 'BUSINESS') {
        const biz = r as JapanBusinessPostalRecord;
        return {
          id: `JP-BIZ-${biz.postalCode}-${idx}`,
          primaryName: biz.businessNameJa,
          secondaryName: biz.businessName,
          area: biz.townAreaNameJa || biz.municipalityNameJa,
          city: biz.municipalityNameJa,
          districtCounty: biz.municipalityNameEn,
          provinceState: biz.prefectureNameJa,
          country: 'Japan',
          postalCode: biz.postalCode,
          officeType: 'BUSINESS',
          deliveryStatus: 'Large User Business Delivery',
          administrativeType: 'Business',
          rawRecord: biz,
        };
      }

      const area = r as JapanAreaPostalRecord;
      const displayTown = area.townArea.nameJa;
      const displayTownEn = area.townArea.nameEn;
      const wardCounty = area.municipality.countyNameJa || area.municipality.administrativeType;

      return {
        id: `JP-${area.prefectureCode}-${area.postalCode}-${idx}`,
        primaryName: `${displayTown} (${displayTownEn})`,
        secondaryName: area.townArea.landmarkEn || area.municipality.nameJa,
        area: displayTown,
        city: area.municipality.nameJa,
        districtCounty: wardCounty,
        provinceState: area.prefectureNameJa,
        country: 'Japan',
        postalCode: area.postalCode,
        officeType: 'AREA',
        deliveryStatus: 'Standard Area Delivery',
        talukSubDistrict: area.municipality.jisCode ? `JIS: ${area.municipality.jisCode}` : undefined,
        administrativeType: area.administrativeType,
        rawRecord: area,
      };
    });

    const townNames = universalRecords.map((r) => r.area);

    return {
      found: true,
      postalCode: result.postalCodeFormatted,
      countryName: 'Japan',
      records: universalRecords,
      areas: townNames.length > 0 ? townNames : [result.primaryMatch?.postalCode || 'Standard Delivery'],
      defaultArea: townNames[0] || '',
      executionTimeMs: result.executionTimeMs,
    };
  },
  getDatasetStats: async (): Promise<DatasetStats> => {
    try {
      const index = await getJapanIndex();
      return {
        countryName: 'Japan',
        summaryTitle: '47 Prefectures & Individual Business Codes',
        divisionCountStr: `${index.administrativeSummary.prefectureCount} Prefectures (1 To, 1 Do, 2 Fu, 43 Ken)`,
        postalCodeCountStr: `${index.statistics.uniquePostalCodes} Verified Postal Codes`,
        officeCountStr: `${index.statistics.totalRecords} Area & Business Records`,
        sourceAttribution: 'Japan Post (日本郵便) & Ministry of Internal Affairs and Communications (総務省)',
        statusText: '100% Offline Local Intelligence',
      };
    } catch {
      return {
        countryName: 'Japan',
        summaryTitle: '47 Prefectures & Business Codes',
        divisionCountStr: '47 Prefectures',
        postalCodeCountStr: '69 Verified Postal Codes',
        officeCountStr: '70 Area & Business Records',
        sourceAttribution: 'Japan Post & MIC e-Stat',
        statusText: '100% Local Dataset',
      };
    }
  },
};
