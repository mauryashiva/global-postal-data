import type { CountryConfig, UniversalPostalRecord, UniversalLookupResult, DatasetStats } from './types';
import {
  lookupIndonesiaPostalCode,
  validateIndonesiaPostalCode,
  normalizeIndonesiaPostalCode,
  getIndonesiaIndex,
  type IndonesiaPostalRecord,
} from '../../../public/data/indonesia-postal/lookup';

export const indonesiaConfig: CountryConfig = {
  id: 'ID',
  name: 'Indonesia',
  nativeName: 'Republik Indonesia',
  flag: '🇮🇩',
  isoAlpha2: 'ID',
  isoAlpha3: 'IDN',
  isoNumeric: '360',
  phoneCode: '+62',
  postalCode: {
    label: 'Postal Code (Kode Pos)',
    length: 5,
    numeric: true,
    placeholder: '5 digits (e.g. 40198 or 10110)',
    regex: /^[0-9]{5}$/,
    validate: (val: string) => validateIndonesiaPostalCode(val).valid,
    clean: (val: string) => normalizeIndonesiaPostalCode(val).slice(0, 5),
  },
  presets: [
    { code: '40198', label: 'Bandung Sukaluyu', badge: 'West Java / City', description: 'Sukaluyu, Cibeunying Kaler, Kota Bandung' },
    { code: '10110', label: 'Istana Merdeka / Gambir', badge: 'DKI Jakarta / Central', description: 'Merdeka Palace & Monas, Jakarta Pusat' },
    { code: '12190', label: 'SCBD Sudirman', badge: 'DKI Jakarta / South', description: 'Sudirman Central Business District, Senayan' },
    { code: '14530', label: 'Kepulauan Seribu', badge: 'Jakarta / Regency', description: 'Pramuka Island Government Center' },
    { code: '40911', label: 'Bandung Regency (Soreang)', badge: 'West Java / Regency', description: 'Pamekaran, Soreang Regency Capital' },
    { code: '55122', label: 'Kraton Yogyakarta', badge: 'DI Yogyakarta / Palace', description: 'Sultan Palace of Yogyakarta' },
    { code: '60271', label: 'Surabaya City Hall', badge: 'East Java / City', description: 'Embong Kaliasin, Genteng, Kota Surabaya' },
    { code: '80361', label: 'Kuta Beach Resort', badge: 'Bali / Badung', description: 'Kuta, Badung Regency Tourism Center' },
    { code: '20111', label: 'Medan Petisah', badge: 'North Sumatra / City', description: 'Petisah Tengah, Kota Medan' },
    { code: '90111', label: 'Makassar Losari Beach', badge: 'South Sulawesi / City', description: 'Bulo Gading, Ujung Pandang, Makassar' },
    { code: '75571', label: 'IKN Nusantara Sepaku', badge: 'East Kalimantan / Capital', description: 'Bumi Harapan, KIPP IKN Nusantara' },
    { code: '99111', label: 'Jayapura Port', badge: 'Papua / Provincial Capital', description: 'Gurabesi, Jayapura Utara, Kota Jayapura' },
  ],
  fields: [
    {
      key: 'province',
      label: 'Province (Provinsi)',
      placeholder: 'Indonesian Province (38 Provinces)',
      readOnly: true,
      required: true,
      order: 1,
      helpText: 'Official 1st-level administrative division (Provinsi)',
    },
    {
      key: 'cityRegency',
      label: 'City / Regency (Kota / Kabupaten)',
      placeholder: 'Kota (City) or Kabupaten (Regency)',
      readOnly: true,
      required: true,
      order: 2,
      helpText: 'Second-level administrative division (distinct City vs Regency)',
    },
    {
      key: 'district',
      label: 'District (Kecamatan)',
      placeholder: 'Kecamatan (District)',
      readOnly: true,
      required: true,
      order: 3,
      helpText: 'Third-level administrative division (Kecamatan)',
    },
    {
      key: 'villageLocality',
      label: 'Village / Locality (Desa / Kelurahan)',
      placeholder: 'Desa (Village) or Kelurahan (Urban Village)',
      readOnly: true,
      required: true,
      order: 4,
      helpText: 'Fourth-level administrative unit (Desa / Kelurahan)',
    },
    {
      key: 'postalCode',
      label: 'Postal Code (Kode Pos)',
      placeholder: '5-digit numeric postal code',
      readOnly: true,
      required: true,
      order: 5,
    },
    {
      key: 'postOfficeArea',
      label: 'Post Office / Area (Kantor Pos / Wilayah)',
      placeholder: 'Pos Indonesia servicing branch or locality area',
      readOnly: true,
      required: false,
      order: 6,
    },
    {
      key: 'country',
      label: 'Country',
      placeholder: 'Indonesia',
      readOnly: true,
      required: true,
      order: 7,
    },
  ],
  tableColumns: [
    {
      key: 'villageLocality',
      label: 'Village / Locality (Desa/Kelurahan)',
      getValue: (r) => r.primaryName,
    },
    {
      key: 'district',
      label: 'District (Kecamatan)',
      getValue: (r) => r.talukSubDistrict || '—',
    },
    {
      key: 'cityRegency',
      label: 'City / Regency (Kota/Kabupaten)',
      getValue: (r) => r.city,
      badge: (r) => {
        const isCity = r.administrativeType === 'City' || r.administrativeType === 'Administrative City';
        return {
          text: isCity ? 'City (Kota)' : 'Regency (Kabupaten)',
          variant: isCity ? 'info' : 'warning',
        };
      },
    },
    {
      key: 'province',
      label: 'Province (Provinsi)',
      getValue: (r) => r.provinceState,
      badge: (r) => ({
        text: r.provinceState,
        variant: 'neutral',
      }),
    },
    {
      key: 'postalCode',
      label: 'Kode Pos',
      getValue: (r) => r.postalCode,
      badge: (r) => ({
        text: r.postalCode,
        variant: 'neutral',
      }),
    },
  ],
  formatFullAddress: (record, postalCode, premises, selectedArea) => {
    const raw = record.rawRecord as IndonesiaPostalRecord;
    const parts: string[] = [];

    if (premises.addressLine1?.trim()) parts.push(premises.addressLine1.trim());
    if (premises.addressLine2?.trim()) parts.push(premises.addressLine2.trim());

    if (raw?.locality?.nameId) {
      parts.push(raw.locality.nameId);
    }

    const rtRwStr = raw?.rt && raw?.rw ? `RT ${raw.rt} / RW ${raw.rw}` : '';
    const villageStr = selectedArea || raw?.village?.nameId || record.area;
    const districtStr = raw?.district?.nameId || record.talukSubDistrict || '';
    const line3 = [rtRwStr, villageStr, districtStr].filter(Boolean).join(', ');
    if (line3) parts.push(line3);

    const cityStr = raw?.kabupatenKota?.nameId || record.city;
    const provStr = raw?.province?.nameId || record.provinceState;
    parts.push(`${cityStr}, ${provStr} ${postalCode}`);
    parts.push('INDONESIA');

    return parts.join('\n');
  },
  lookup: async (postalCode: string): Promise<UniversalLookupResult> => {
    const result = await lookupIndonesiaPostalCode(postalCode);

    if (!result.found || result.matches.length === 0) {
      return {
        found: false,
        postalCode,
        countryName: 'Indonesia',
        records: [],
        executionTimeMs: result.executionTimeMs,
        error: result.error || 'Postal code not found in local Indonesia dataset.',
      };
    }

    const universalRecords: UniversalPostalRecord[] = result.matches.map((r: IndonesiaPostalRecord, idx: number) => {
      const villageType = r.village.administrativeType;
      const displayVillage = r.village.nameId;
      const displayVillageEn = r.village.nameEn;
      const postOfficeName = r.postOffice?.nameId || `Kantor Pos ${r.district.nameId}`;

      return {
        id: `ID-${r.province.code}-${r.postalCode}-${r.village.code || idx}`,
        primaryName: `${displayVillage} (${displayVillageEn})`,
        secondaryName: r.locality?.nameId || postOfficeName,
        area: displayVillage,
        city: r.kabupatenKota.nameId,
        districtCounty: r.kabupatenKota.administrativeType,
        provinceState: r.province.nameId,
        country: 'Indonesia',
        postalCode: r.postalCode,
        officeType: r.postOffice?.type || villageType,
        deliveryStatus: r.postOffice?.deliveryStatus || 'Standard Postal Delivery',
        talukSubDistrict: r.district.nameId,
        administrativeType: r.kabupatenKota.administrativeType,
        phone: r.postOffice?.phone,
        rawRecord: r,
      };
    });

    const areaNames = universalRecords.map((r) => r.area);

    return {
      found: true,
      postalCode: result.postalCode,
      countryName: 'Indonesia',
      records: universalRecords,
      areas: areaNames.length > 0 ? areaNames : [universalRecords[0].area],
      defaultArea: areaNames[0] || '',
      executionTimeMs: result.executionTimeMs,
    };
  },
  getDatasetStats: async (): Promise<DatasetStats> => {
    try {
      const index = await getIndonesiaIndex();
      return {
        countryName: 'Indonesia',
        summaryTitle: '38 Provinces & 5-Digit Postal Codes',
        divisionCountStr: `${index.administrativeStructure.provinceCount} Provinces (${index.administrativeStructure.kabupatenCount} Regencies, ${index.administrativeStructure.kotaCount} Cities)`,
        postalCodeCountStr: `${index.statistics.uniquePostalCodes} Verified Postal Codes`,
        officeCountStr: `${index.statistics.totalPostalRecords} Postal Records & Areas`,
        sourceAttribution: 'Badan Pusat Statistik (BPS), Kemendagri & PT Pos Indonesia',
        statusText: '100% Offline Local Intelligence',
      };
    } catch {
      return {
        countryName: 'Indonesia',
        summaryTitle: '38 Provinces & 5-Digit Postal Codes',
        divisionCountStr: '38 Provinces',
        postalCodeCountStr: '40 Verified Postal Codes',
        officeCountStr: '45 Postal Records',
        sourceAttribution: 'BPS, Kemendagri & PT Pos Indonesia',
        statusText: '100% Local Dataset',
      };
    }
  },
};
