import type { CountryConfig, UniversalPostalRecord, UniversalLookupResult, DatasetStats } from './types';
import {
  lookupEgyptPostalCode,
  validateEgyptPostalCode,
  getEgyptIndex,
  type EgyptPostalRecord
} from '../../../public/data/egypt-postal/lookup';

export const egyptConfig: CountryConfig = {
  id: 'EG',
  name: 'Egypt',
  nativeName: 'مصر',
  flag: '🇪🇬',
  isoAlpha2: 'EG',
  isoAlpha3: 'EGY',
  isoNumeric: '818',
  phoneCode: '+20',
  postalCode: {
    label: 'Postal Code',
    length: 5,
    numeric: true,
    placeholder: 'e.g. 11511 or 12511',
    regex: /^[0-9]{5}$/,
    validate: (val: string) => validateEgyptPostalCode(val).valid,
    clean: (val: string) => (val || '').replace(/[^0-9]/g, '').slice(0, 5),
  },
  presets: [
    { code: '11511', label: 'Cairo Main (Ataba)', badge: 'Capital', description: 'Central Cairo national postal headquarters' },
    { code: '11765', label: 'Nasr City 1st District', badge: 'Cairo', description: 'Major eastern commercial and diplomatic hub' },
    { code: '11835', label: 'New Cairo 5th Settlement', badge: 'Cairo', description: 'Modern financial center & 90th Street corridor' },
    { code: '12511', label: 'Giza First (Murad)', badge: 'Giza', description: 'Giza downtown & Orman Gardens sector' },
    { code: '12566', label: '6th of October City', badge: 'Giza', description: 'Industrial hub & Central Axis corridor' },
    { code: '21511', label: 'Alexandria Raml Station', badge: 'Alexandria', description: 'Historic Mediterranean central movement center' },
    { code: '35511', label: 'Mansoura Main', badge: 'Dakahlia', description: 'Nile Delta commercial and medical center' },
    { code: '42511', label: 'Port Said Main', badge: 'Port Said', description: 'Northern entrance to Suez Canal maritime hub' },
    { code: '85951', label: 'Luxor Main', badge: 'Luxor', description: 'Upper Egypt historic temple gateway' },
    { code: '46619', label: 'Sharm El Sheikh', badge: 'South Sinai', description: 'Red Sea international resort & conference center' },
    { code: '81511', label: 'Aswan Main', badge: 'Aswan', description: 'Southern regional gateway & High Dam corridor' },
  ],
  fields: [
    {
      key: 'locality',
      label: 'Locality / Neighborhood',
      placeholder: 'Auto-populated locality or delivery zone',
      readOnly: true,
      required: true,
      order: 1,
      helpText: 'Local delivery zone or neighborhood'
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
      label: 'City / Town',
      placeholder: 'Auto-populated city or town',
      readOnly: true,
      required: true,
      order: 3
    },
    {
      key: 'district',
      label: 'District / Area',
      placeholder: 'Auto-populated Qism or Markaz',
      readOnly: true,
      required: true,
      order: 4
    },
    {
      key: 'governorate',
      label: 'Governorate',
      placeholder: 'Auto-populated governorate (محافظة)',
      readOnly: true,
      required: true,
      order: 5
    },
    {
      key: 'country',
      label: 'Country',
      placeholder: 'Egypt',
      readOnly: true,
      required: true,
      order: 6
    },
  ],
  tableColumns: [
    {
      key: 'locality',
      label: 'Locality / Neighborhood',
      getValue: (r) => r.area,
    },
    {
      key: 'postOffice',
      label: 'Post Office',
      getValue: (r) => r.primaryName,
    },
    {
      key: 'district',
      label: 'District (قسم / مركز)',
      getValue: (r) => r.districtCounty,
    },
    {
      key: 'city',
      label: 'City / Town (مدينة)',
      getValue: (r) => r.city,
    },
    {
      key: 'governorate',
      label: 'Governorate (محافظة)',
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
    parts.push('EGYPT');

    return parts.join(', ');
  },
  lookup: async (postalCode: string): Promise<UniversalLookupResult> => {
    const result = await lookupEgyptPostalCode(postalCode);

    if (!result.found || result.records.length === 0) {
      return {
        found: false,
        postalCode,
        countryName: 'Egypt',
        records: [],
        executionTimeMs: result.executionTimeMs,
        error: result.error || 'Postal code not found in local Egypt dataset.',
      };
    }

    const universalRecords: UniversalPostalRecord[] = result.records.map((r: EgyptPostalRecord, idx: number) => {
      const areaDisplay = r.locality.nameEn || (r.areas && r.areas[0]) || r.city.nameEn;
      const primaryOffice = r.postOffice.nameEn || `${r.city.nameEn} Post Office`;

      return {
        id: `EG-${r.postalCode}-${idx}`,
        primaryName: primaryOffice,
        secondaryName: r.locality.nameEn,
        area: areaDisplay,
        city: r.city.nameEn,
        districtCounty: `${r.district.nameEn} (${r.district.administrativeType})`,
        provinceState: `${r.governorate.nameEn} (${r.governorate.nameNative})`,
        country: 'Egypt',
        postalCode: r.postalCode,
        officeType: r.postOffice.type,
        administrativeType: r.district.administrativeType,
        latitude: r.coordinates?.latitude || null,
        longitude: r.coordinates?.longitude || null,
        rawRecord: r,
      };
    });

    return {
      found: true,
      postalCode,
      countryName: 'Egypt',
      records: universalRecords,
      areas: result.areas,
      defaultArea: result.defaultArea,
      executionTimeMs: result.executionTimeMs,
    };
  },
  getDatasetStats: async (): Promise<DatasetStats> => {
    try {
      const index = await getEgyptIndex();
      return {
        countryName: 'Egypt',
        summaryTitle: '27 Official Governorates (محافظات مصر)',
        divisionCountStr: `${index.administrativeSummary.governorateCount} Governorates`,
        postalCodeCountStr: `${index.statistics.uniquePostalCodes.toLocaleString()} Unique 5-Digit Codes`,
        officeCountStr: `${index.statistics.totalLocalities.toLocaleString()} Verified Delivery Localities`,
        sourceAttribution: 'Egypt Post (البريد المصري) & Universal Postal Union (UPU)',
        statusText: '100% Offline Local Intelligence',
      };
    } catch {
      return {
        countryName: 'Egypt',
        summaryTitle: '27 Governorates',
        divisionCountStr: '27 Governorates',
        postalCodeCountStr: '100 Unique Codes',
        officeCountStr: '391 Delivery Localities',
        sourceAttribution: 'Egypt Post & UPU S42 Standard',
        statusText: '100% Local Dataset',
      };
    }
  },
};
