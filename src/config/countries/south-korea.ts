import type { CountryConfig, UniversalPostalRecord, UniversalLookupResult, DatasetStats } from './types';
import {
  lookupSouthKoreaPostalCode,
  validateSouthKoreaPostalCode,
  getSouthKoreaIndex,
  type SouthKoreaPostalRecord,
} from '../../../public/data/south-korea-postal/lookup';

export const southKoreaConfig: CountryConfig = {
  id: 'KR',
  name: 'South Korea',
  nativeName: '대한민국',
  flag: '🇰🇷',
  isoAlpha2: 'KR',
  isoAlpha3: 'KOR',
  isoNumeric: '410',
  phoneCode: '+82',
  postalCode: {
    label: 'Postal Code (우편번호)',
    length: 5,
    numeric: true,
    placeholder: 'e.g. 04524 or 06236',
    regex: /^[0-9]{5}$/,
    validate: (val: string) => validateSouthKoreaPostalCode(val).valid,
    clean: (val: string) => (val || '').replace(/[^0-9]/g, '').slice(0, 5),
  },
  presets: [
    { code: '04524', label: 'Seoul City Hall', badge: 'Special City', description: 'Seoul Metropolitan Government, Jung-gu' },
    { code: '03172', label: 'Gwanghwamun', badge: 'Seoul', description: 'Government Complex Seoul, Jongno-gu' },
    { code: '06236', label: 'Gangnam GFC', badge: 'Seoul', description: 'Gangnam Finance Center, Teheran-ro corridor' },
    { code: '07326', label: 'Yeouido IFC', badge: 'Seoul', description: 'International Finance Center, Yeongdeungpo-gu' },
    { code: '48058', label: 'Busan Centum City', badge: 'Metropolitan', description: 'Shinsegae Centum City & BEXCO, Haeundae-gu' },
    { code: '22382', label: 'Incheon Airport T1', badge: 'Metropolitan', description: 'Incheon International Airport Terminal 1' },
    { code: '30103', label: 'Government Sejong', badge: 'Self-Gov City', description: 'Government Complex Sejong (Prime Minister Office)' },
    { code: '13494', label: 'Pangyo Techno Valley', badge: 'Gyeonggi', description: 'Bundang-gu Silicon Valley of Korea' },
    { code: '24266', label: 'Gangwon State Office', badge: 'Self-Gov Prov', description: 'Gangwon Special Self-Governing Province (Chuncheon)' },
    { code: '63122', label: 'Jeju Provincial Office', badge: 'Self-Gov Prov', description: 'Jeju Special Self-Governing Province (Jeju City)' },
    { code: '63535', label: 'ICC Jeju (Jungmun)', badge: 'Jeju', description: 'International Convention Center Jeju (Seogwipo)' },
  ],
  fields: [
    {
      key: 'provinceMetro',
      label: 'Province / Metropolitan Area (시·도)',
      placeholder: 'Auto-populated province or metropolitan city',
      readOnly: true,
      required: true,
      order: 1,
      helpText: 'Special City, Metropolitan City, Special Self-Governing City/Province, or Province',
    },
    {
      key: 'cityCounty',
      label: 'City / County (시·군·구)',
      placeholder: 'Auto-populated city or county',
      readOnly: true,
      required: true,
      order: 2,
    },
    {
      key: 'district',
      label: 'District (구·군)',
      placeholder: 'Auto-populated autonomous district or sub-county',
      readOnly: true,
      required: true,
      order: 3,
    },
    {
      key: 'townDong',
      label: 'Town / Township / Dong (읍·면·동)',
      placeholder: 'Auto-populated town or dong',
      readOnly: true,
      required: true,
      order: 4,
    },
    {
      key: 'roadName',
      label: 'Road Name (도로명)',
      placeholder: 'Auto-populated road name',
      readOnly: true,
      required: true,
      order: 5,
    },
    {
      key: 'buildingNumber',
      label: 'Building Number (건물번호)',
      placeholder: 'Auto-populated building number',
      readOnly: true,
      required: true,
      order: 6,
    },
    {
      key: 'locality',
      label: 'Address / Locality (건물명 및 상세지역)',
      placeholder: 'Auto-populated building name or locality',
      readOnly: true,
      required: true,
      order: 7,
    },
    {
      key: 'country',
      label: 'Country (국가)',
      placeholder: 'South Korea (대한민국)',
      readOnly: true,
      required: true,
      order: 8,
    },
  ],
  tableColumns: [
    {
      key: 'roadAddress',
      label: 'Road Address (도로명주소)',
      getValue: (r) => {
        const road = r.rawRecord?.roadAddress;
        if (road) {
          return `${road.buildingNumber}, ${road.roadName} (${road.roadNameKo})`;
        }
        return r.area;
      },
    },
    {
      key: 'buildingName',
      label: 'Building / Landmark (건물명)',
      getValue: (r) => {
        const road = r.rawRecord?.roadAddress;
        return road?.buildingName || r.primaryName;
      },
    },
    {
      key: 'townDong',
      label: 'Dong / Jibun (동·지번)',
      getValue: (r) => {
        const jibun = r.rawRecord?.jibunAddress;
        if (jibun) {
          return `${jibun.legalDong} (${jibun.legalDongKo})`;
        }
        return r.talukSubDistrict || '—';
      },
    },
    {
      key: 'district',
      label: 'District (시·군·구)',
      getValue: (r) => r.districtCounty,
    },
    {
      key: 'provinceMetro',
      label: 'Province / Metro (시·도)',
      getValue: (r) => r.provinceState,
      badge: (r) => {
        const adminType = r.rawRecord?.administrative?.firstLevel?.administrativeType || 'Province';
        let variant: 'success' | 'warning' | 'info' | 'neutral' = 'neutral';
        if (adminType.includes('Special City')) variant = 'success';
        else if (adminType.includes('Metropolitan')) variant = 'info';
        else if (adminType.includes('Special Self-Governing')) variant = 'warning';
        return {
          text: adminType,
          variant,
        };
      },
    },
    {
      key: 'postalCode',
      label: 'Postal Code (우편번호)',
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

    const road = record.rawRecord?.roadAddress;
    if (road?.fullAddressEn) {
      if (premises.addressLine1?.trim() || premises.addressLine2?.trim()) {
        parts.push(road.fullAddressEn);
      } else {
        return road.fullAddressEn;
      }
    } else {
      const area = selectedArea?.trim() || record.area;
      if (area && !parts.includes(area)) parts.push(area);
      if (record.districtCounty && !parts.includes(record.districtCounty)) parts.push(record.districtCounty);
      if (record.provinceState && !parts.includes(record.provinceState)) parts.push(record.provinceState);
      parts.push(`${postalCode}`);
      parts.push('REPUBLIC OF KOREA');
    }

    return parts.join(', ');
  },
  lookup: async (postalCode: string): Promise<UniversalLookupResult> => {
    const result = await lookupSouthKoreaPostalCode(postalCode);

    if (!result.found || result.records.length === 0) {
      return {
        found: false,
        postalCode,
        countryName: 'South Korea',
        records: [],
        executionTimeMs: result.executionTimeMs,
        error: result.error || 'Postal code not found in local South Korea dataset.',
      };
    }

    const universalRecords: UniversalPostalRecord[] = result.records.map((r: SouthKoreaPostalRecord, idx: number) => {
      const bldgEn = r.roadAddress.buildingName || `${r.roadAddress.buildingNumber}, ${r.roadAddress.roadName}`;
      const firstLevel = r.administrative.firstLevel;
      const districtDisplay = `${r.administrative.district.nameEn} (${r.administrative.district.nameKo})`;
      const provinceDisplay = `${firstLevel.nameEn} (${firstLevel.nameKo})`;

      return {
        id: `KR-${r.postalCode}-${idx}`,
        primaryName: r.roadAddress.buildingName || r.postOffice.nameEn,
        secondaryName: r.roadAddress.buildingNameKo || r.postOffice.nameKo,
        area: `${r.roadAddress.buildingNumber}, ${r.roadAddress.roadName} (${r.jibunAddress.legalDong})`,
        city: `${r.administrative.cityCounty.nameEn} (${r.administrative.cityCounty.nameKo})`,
        districtCounty: districtDisplay,
        provinceState: provinceDisplay,
        country: 'South Korea',
        postalCode: r.postalCode,
        officeType: r.postOffice.type,
        deliveryStatus: 'Delivery',
        phone: r.postOffice.phone,
        talukSubDistrict: `${r.administrative.townDong.nameEn} (${r.administrative.townDong.nameKo})`,
        administrativeType: firstLevel.administrativeType,
        latitude: r.coordinates?.latitude || null,
        longitude: r.coordinates?.longitude || null,
        rawRecord: r,
      };
    });

    return {
      found: true,
      postalCode,
      countryName: 'South Korea',
      records: universalRecords,
      areas: result.areas,
      defaultArea: result.defaultArea,
      executionTimeMs: result.executionTimeMs,
    };
  },
  getDatasetStats: async (): Promise<DatasetStats> => {
    try {
      const index = await getSouthKoreaIndex();
      return {
        countryName: 'South Korea',
        summaryTitle: '17 First-Level Administrative Divisions (대한민국 17개 시·도)',
        divisionCountStr: `${index.administrativeSummary.totalFirstLevelDivisions} Divisions (1 Special, 6 Metro, 1 City, 9 Prov)`,
        postalCodeCountStr: `${index.statistics.uniquePostalCodes.toLocaleString()} Unique 5-Digit Codes`,
        officeCountStr: `${index.statistics.totalAddresses.toLocaleString()} Verified Road-Name Addresses`,
        sourceAttribution: 'Korea Post (우정사업본부) & MOIS (도로명주소 juso.go.kr)',
        statusText: '100% Offline Local Intelligence',
      };
    } catch {
      return {
        countryName: 'South Korea',
        summaryTitle: '17 Divisions',
        divisionCountStr: '17 First-Level Divisions',
        postalCodeCountStr: '45 Unique Codes',
        officeCountStr: '45 Road-Name Addresses',
        sourceAttribution: 'Korea Post & Ministry of the Interior and Safety',
        statusText: '100% Local Dataset',
      };
    }
  },
};
