import type { CountryConfig, UniversalPostalRecord, UniversalLookupResult, DatasetStats } from './types';
import {
  lookupSriLankaPostcode,
  validateSriLankaPostcode,
  getSriLankaPostalIndex,
  type SriLankaPostalRecord,
} from '../../../public/data/sri-lanka-postal/lookup';

export const sriLankaConfig: CountryConfig = {
  id: 'LK',
  name: 'Sri Lanka',
  nativeName: 'ශ්‍රී ලංකාව / இலங்கை',
  flag: '🇱🇰',
  isoAlpha2: 'LK',
  isoAlpha3: 'LKA',
  isoNumeric: '144',
  phoneCode: '+94',
  postalCode: {
    label: 'Postal Code (තැපැල් කේතය / அஞ்சல் குறியீடு)',
    length: 5,
    numeric: true,
    placeholder: '5 digits (e.g. 00100, 20000, 80000)',
    regex: /^[0-9]{5}$/,
    validate: (val: string) => validateSriLankaPostcode(val).valid,
    clean: (val: string) => val.trim().replace(/\s+/g, '').slice(0, 5),
  },
  presets: [
    { code: '00100', label: 'Colombo 1 (Fort)', badge: 'Western / Colombo', description: 'Central Business District, President’s House, Port City' },
    { code: '00200', label: 'Colombo 2 (Slave Island)', badge: 'Western / Multi-Match', description: 'Slave Island / Union Place / Kompannavidiya commercial hub' },
    { code: '00700', label: 'Colombo 7 (Cinnamon Gardens)', badge: 'Western / Colombo', description: 'Cinnamon Gardens, Prime Residential, Town Hall' },
    { code: '10100', label: 'Sri Jayawardenepura Kotte', badge: 'Western / Capital', description: 'Administrative Capital of Sri Lanka, Parliament' },
    { code: '11500', label: 'Negombo', badge: 'Western / Gampaha', description: 'Major Coastal Hub, Katunayake BIA Airport gateway' },
    { code: '12000', label: 'Kalutara', badge: 'Western / Kalutara', description: 'Kalutara Bodhiya, District Administrative Capital' },
    { code: '20000', label: 'Kandy Central', badge: 'Central / Capital', description: 'Historic Hill Capital, Temple of the Sacred Tooth Relic' },
    { code: '21000', label: 'Matale', badge: 'Central / Matale', description: 'Aluvihare, Spice Gardens & Knuckles Range' },
    { code: '22200', label: 'Nuwara Eliya', badge: 'Central / Nuwara Eliya', description: 'Tea Capital & Hill Station (Little England)' },
    { code: '30000', label: 'Batticaloa', badge: 'Eastern / Batticaloa', description: 'Eastern Province Lagoon City & Administrative Capital' },
    { code: '31000', label: 'Trincomalee', badge: 'Eastern / Trincomalee', description: 'Historic Deep Natural Harbour & Provincial Capital' },
    { code: '31200', label: 'Ampara', badge: 'Eastern / Ampara', description: 'Administrative District Capital of Ampara' },
    { code: '40000', label: 'Jaffna Central', badge: 'Northern / Capital', description: 'Cultural & Historic Capital of Northern Province' },
    { code: '50000', label: 'Anuradhapura', badge: 'North Central / Ancient', description: 'Ancient Sacred City, UNESCO World Heritage Site' },
    { code: '60000', label: 'Kurunegala', badge: 'North Western / Capital', description: 'Ethagala (Elephant Rock) & Wayamba Provincial Capital' },
    { code: '70000', label: 'Ratnapura', badge: 'Sabaragamuwa / Capital', description: 'City of Gems (Ratna-pura) & Adam’s Peak Gateway' },
    { code: '80000', label: 'Galle Fort', badge: 'Southern / Galle', description: 'UNESCO World Heritage 17th Century Dutch Fort' },
    { code: '90000', label: 'Badulla', badge: 'Uva / Capital', description: 'Provincial Capital of Uva Province, Muthiyangana' },
  ],
  fields: [
    {
      key: 'province',
      label: 'Province (පළාත / மாகாணம்)',
      placeholder: '1 of 9 Administrative Provinces',
      readOnly: true,
      required: true,
      order: 1,
      helpText: 'Official 1st-level administrative division (9 Provinces)',
    },
    {
      key: 'district',
      label: 'Administrative District (දිස්ත්‍රික්කය / மாவட்டம்)',
      placeholder: '1 of 25 Administrative Districts',
      readOnly: true,
      required: true,
      order: 2,
      helpText: 'Official administrative district (25 Districts)',
    },
    {
      key: 'postalTown',
      label: 'Postal Town (තැපැල් නගරය / தபால் நகரம்)',
      placeholder: 'Designated Sri Lanka Post Postal Town',
      readOnly: true,
      required: true,
      order: 3,
      helpText: 'Designated postal town required by Sri Lanka Post addressing guidance',
    },
    {
      key: 'dsDivision',
      label: 'DS Division (ප්‍රාදේශීය ලේකම් කොට්ඨාසය)',
      placeholder: 'Divisional Secretariat Division',
      readOnly: true,
      required: false,
      order: 4,
      helpText: 'Divisional Secretariat Division administrative level (340 DCS units)',
    },
    {
      key: 'locality',
      label: 'Locality / Area (ප්‍රදේශය / பிரதேசம்)',
      placeholder: 'Sub-locality, village, or delivery area',
      readOnly: true,
      required: false,
      order: 5,
    },
    {
      key: 'postOffice',
      label: 'Post Office (තැපැල් කාර්යාලය / தபால் நிலையம்)',
      placeholder: 'Sub-post office or delivery branch',
      readOnly: true,
      required: false,
      order: 6,
    },
    {
      key: 'postcode',
      label: 'Postal Code (තැපැල් අංකය)',
      placeholder: '5-digit numeric postal code',
      readOnly: true,
      required: true,
      order: 7,
    },
    {
      key: 'country',
      label: 'Country (රට / நாடு)',
      placeholder: 'Sri Lanka (ශ්‍රී ලංකාව)',
      readOnly: true,
      required: true,
      order: 8,
    },
  ],
  tableColumns: [
    {
      key: 'locality',
      label: 'Postal Town / Locality',
      getValue: (r) => r.city || r.primaryName,
    },
    {
      key: 'district',
      label: 'Administrative District',
      getValue: (r) => r.districtCounty || '—',
      badge: (r) => ({
        text: `${r.districtCounty} District`,
        variant: 'neutral',
      }),
    },
    {
      key: 'province',
      label: 'Province',
      getValue: (r) => r.provinceState,
      badge: (r) => ({
        text: r.provinceState,
        variant: 'info',
      }),
    },
    {
      key: 'postalCode',
      label: 'Postal Code',
      getValue: (r) => r.postalCode,
      badge: (r) => ({
        text: r.postalCode,
        variant: 'neutral',
      }),
    },
  ],
  formatFullAddress: (record, postalCode, premises, selectedArea) => {
    const raw = record.rawRecord as SriLankaPostalRecord;
    const parts: string[] = [];

    if (premises.addressLine1?.trim()) parts.push(premises.addressLine1.trim());
    if (premises.addressLine2?.trim()) parts.push(premises.addressLine2.trim());

    const localityStr = selectedArea || raw?.locality?.nameEn || record.area;
    const postalTownStr = (raw?.postalTown?.nameEn || record.city || '').toUpperCase();

    if (localityStr && localityStr.toUpperCase() !== postalTownStr) {
      parts.push(localityStr);
    }

    parts.push(`${postalTownStr} ${postalCode}`);
    parts.push('SRI LANKA');

    return parts.join('\n');
  },
  lookup: async (postalCode: string): Promise<UniversalLookupResult> => {
    const result = await lookupSriLankaPostcode(postalCode);

    if (!result.found || result.matches.length === 0) {
      return {
        found: false,
        postalCode,
        countryName: 'Sri Lanka',
        records: [],
        executionTimeMs: result.executionTimeMs,
        error: result.error || 'Postal code not found in local Sri Lanka dataset.',
      };
    }

    const universalRecords: UniversalPostalRecord[] = result.matches.map((r: SriLankaPostalRecord, idx: number) => {
      const townName = r.postalTown?.nameEn || r.city?.nameEn || r.locality?.nameEn || 'Sri Lanka';
      const districtName = r.district?.nameEn || 'Sri Lanka';
      const provinceName = r.province?.nameEn || 'Sri Lanka';
      const postOfficeName = r.postOffice?.nameEn || `${townName} Post Office`;

      return {
        id: `LK-${r.district?.code || 'DIST'}-${r.postcode}-${idx}`,
        primaryName: postOfficeName,
        secondaryName: `${townName}, ${districtName} (${provinceName})`,
        area: r.locality?.nameEn || townName,
        city: townName,
        districtCounty: districtName,
        provinceState: provinceName,
        country: 'Sri Lanka',
        postalCode: r.postcode,
        officeType: r.postOffice?.type || 'Sub-Post Office',
        deliveryStatus: r.postOffice?.deliveryStatus || 'Active Postal Delivery Area',
        talukSubDistrict: r.dsDivision?.nameEn || undefined,
        administrativeType: r.province?.administrativeType || 'Province',
        latitude: r.coordinates?.latitude,
        longitude: r.coordinates?.longitude,
        rawRecord: r,
      };
    });

    const areaNames = universalRecords.map((r) => r.area);

    return {
      found: true,
      postalCode: result.postcode,
      countryName: 'Sri Lanka',
      records: universalRecords,
      areas: areaNames.length > 0 ? areaNames : [universalRecords[0].area],
      defaultArea: areaNames[0] || '',
      executionTimeMs: result.executionTimeMs,
    };
  },
  getDatasetStats: async (): Promise<DatasetStats> => {
    try {
      const index = await getSriLankaPostalIndex();
      const stats = index?.statistics;
      const uniquePc = stats?.uniquePostcodes || 2047;
      const totalRec = stats?.totalRecords || 2069;
      return {
        countryName: 'Sri Lanka',
        summaryTitle: '9 Provinces, 25 Districts & 5-Digit Postcodes',
        divisionCountStr: '9 Provinces & 25 Administrative Districts',
        postalCodeCountStr: `${uniquePc.toLocaleString()} Verified 5-Digit Postcodes`,
        officeCountStr: `${totalRec.toLocaleString()} Post Offices & Delivery Branches`,
        sourceAttribution: 'Department of Posts & DCS Sri Lanka',
        statusText: '100% Offline Local Intelligence',
      };
    } catch {
      return {
        countryName: 'Sri Lanka',
        summaryTitle: '9 Provinces, 25 Districts & 5-Digit Postcodes',
        divisionCountStr: '9 Provinces & 25 Districts',
        postalCodeCountStr: '2,047 Verified Postcodes',
        officeCountStr: '2,069 Post Offices & Localities',
        sourceAttribution: 'Department of Posts & DCS Sri Lanka',
        statusText: '100% Local Dataset',
      };
    }
  },
};
