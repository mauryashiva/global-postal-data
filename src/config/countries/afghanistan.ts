import type { CountryConfig, UniversalPostalRecord, UniversalLookupResult, DatasetStats } from './types';
import {
  lookupAfghanistanPostalCode,
  validateAfghanistanPostalCode,
  getAfghanistanIndex,
  type AfghanistanPostalRecord
} from '../../../public/data/afghanistan-postal/lookup';

export const afghanistanConfig: CountryConfig = {
  id: 'AF',
  name: 'Afghanistan',
  nativeName: 'افغانستان',
  flag: '🇦🇫',
  isoAlpha2: 'AF',
  isoAlpha3: 'AFG',
  isoNumeric: '004',
  phoneCode: '+93',
  postalCode: {
    label: 'Postal Code',
    length: 6,
    numeric: true,
    placeholder: 'e.g. 100101 or 300101',
    regex: /^[0-9]{6}$/,
    validate: (val: string) => validateAfghanistanPostalCode(val).valid,
    clean: (val: string) => (val || '').replace(/[^0-9]/g, '').slice(0, 6),
  },
  presets: [
    { code: '100101', label: 'Kabul District 1', badge: 'Capital', description: 'National capital central delivery office' },
    { code: '101301', label: 'Dasht-e-Barchi', badge: 'Kabul', description: 'Kabul District 13 western commercial hub' },
    { code: '300101', label: 'Herat City', badge: 'Herat', description: 'Historic western commercial and cultural hub' },
    { code: '170101', label: 'Mazar-i-Sharif', badge: 'Balkh', description: 'Northern regional commercial trade center' },
    { code: '385101', label: 'Reg District', badge: 'Kandahar', description: 'Southern agricultural and transport corridor' },
    { code: '260101', label: 'Jalalabad City', badge: 'Nangarhar', description: 'Eastern economic hub and trade corridor' },
    { code: '340101', label: 'Fayzabad City', badge: 'Badakhshan', description: 'Northeastern provincial gateway' },
    { code: '160101', label: 'Bamyan City', badge: 'Bamyan', description: 'Central highlands regional center' },
    { code: '110101', label: 'Charikar City', badge: 'Parwan', description: 'Central northern transport junction' },
  ],
  fields: [
    {
      key: 'locality',
      label: 'Area / Locality',
      placeholder: 'Auto-populated locality or delivery zone',
      readOnly: true,
      required: true,
      order: 1,
      helpText: 'Delivery zone or local community'
    },
    {
      key: 'postOffice',
      label: 'Post Office',
      placeholder: 'Auto-populated post office branch',
      readOnly: true,
      required: true,
      order: 2
    },
    {
      key: 'city',
      label: 'City',
      placeholder: 'Auto-populated provincial capital or city',
      readOnly: true,
      required: true,
      order: 3
    },
    {
      key: 'district',
      label: 'District',
      placeholder: 'Auto-populated municipal or rural district',
      readOnly: true,
      required: true,
      order: 4
    },
    {
      key: 'province',
      label: 'Province',
      placeholder: 'Auto-populated province (Wilayat)',
      readOnly: true,
      required: true,
      order: 5
    },
    {
      key: 'country',
      label: 'Country',
      placeholder: 'Afghanistan',
      readOnly: true,
      required: true,
      order: 6
    },
  ],
  tableColumns: [
    {
      key: 'locality',
      label: 'Area / Locality',
      getValue: (r) => r.area,
    },
    {
      key: 'postOffice',
      label: 'Post Office Branch',
      getValue: (r) => r.primaryName,
    },
    {
      key: 'district',
      label: 'District (ولسوالی / ناحیه)',
      getValue: (r) => r.districtCounty,
    },
    {
      key: 'city',
      label: 'City (شهر)',
      getValue: (r) => r.city,
    },
    {
      key: 'province',
      label: 'Province (ولایت)',
      getValue: (r) => r.provinceState,
    },
    {
      key: 'postalCode',
      label: 'Postal Code',
      getValue: (r) => r.postalCode,
      badge: (r) => ({
        text: r.postalCode,
        variant: 'neutral'
      })
    }
  ],
  formatFullAddress: (record, postalCode, premises, selectedArea) => {
    const parts: string[] = [];
    if (premises.addressLine1?.trim()) parts.push(premises.addressLine1.trim());
    if (premises.addressLine2?.trim()) parts.push(premises.addressLine2.trim());

    const area = selectedArea?.trim() || record.area;
    if (area && !parts.includes(area)) parts.push(area);

    if (record.primaryName && !parts.includes(record.primaryName)) {
      parts.push(record.primaryName);
    }

    if (record.districtCounty && !parts.includes(record.districtCounty)) {
      parts.push(record.districtCounty);
    }

    if (record.city && !parts.includes(record.city)) {
      parts.push(record.city);
    }

    parts.push(`${postalCode} ${record.provinceState}`);
    parts.push('AFGHANISTAN');

    return parts.join(', ');
  },
  lookup: async (postalCode: string): Promise<UniversalLookupResult> => {
    const result = await lookupAfghanistanPostalCode(postalCode);

    if (!result.found || result.records.length === 0) {
      return {
        found: false,
        postalCode,
        countryName: 'Afghanistan',
        records: [],
        executionTimeMs: result.executionTimeMs,
        error: result.error || 'Postal code not found in local Afghanistan dataset.',
      };
    }

    const universalRecords: UniversalPostalRecord[] = result.records.map((r: AfghanistanPostalRecord, idx: number) => {
      const areaDisplay = r.locality.nameEn || r.district.nameEn;
      const primaryOffice = r.postOffice.nameEn || `${r.city.nameEn} Post Office`;

      return {
        id: `AF-${r.postalCode}-${idx}`,
        primaryName: primaryOffice,
        secondaryName: r.locality.nameEn,
        area: areaDisplay,
        city: r.city.nameEn,
        districtCounty: r.district.nameEn,
        provinceState: `${r.province.nameEn} (${r.province.nameNative})`,
        country: 'Afghanistan',
        postalCode: r.postalCode,
        officeType: r.postOffice.type,
        deliveryStatus: r.postOffice.deliveryStatus,
        administrativeType: r.district.type,
        latitude: r.coordinates?.latitude || null,
        longitude: r.coordinates?.longitude || null,
        rawRecord: r,
      };
    });

    return {
      found: true,
      postalCode,
      countryName: 'Afghanistan',
      records: universalRecords,
      areas: result.areas,
      defaultArea: result.defaultArea,
      executionTimeMs: result.executionTimeMs,
    };
  },
  getDatasetStats: async (): Promise<DatasetStats> => {
    try {
      const index = await getAfghanistanIndex();
      return {
        countryName: 'Afghanistan',
        summaryTitle: '34 Official Provinces (Wilayat)',
        divisionCountStr: `${index.statistics.provinceCount} Provinces`,
        postalCodeCountStr: `${index.statistics.uniquePostalCodes.toLocaleString()} Unique 6-Digit Codes`,
        officeCountStr: `${index.statistics.totalRecords.toLocaleString()} Verified Delivery Zones`,
        sourceAttribution: 'Afghan Post & Universal Postal Union (UPU) S42 Standard',
        statusText: '100% Offline Local Intelligence',
      };
    } catch {
      return {
        countryName: 'Afghanistan',
        summaryTitle: '34 Provinces',
        divisionCountStr: '34 Provinces',
        postalCodeCountStr: '1,323 Unique Codes',
        officeCountStr: '1,323 Delivery Zones',
        sourceAttribution: 'Afghan Post & UPU (2024/2025 Standard)',
        statusText: '100% Local Dataset',
      };
    }
  },
};
