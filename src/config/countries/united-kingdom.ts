import type { CountryConfig, UniversalPostalRecord, UniversalLookupResult, DatasetStats } from './types';
import {
  lookupUKPostcode,
  validateUKPostcode,
  normalizeUKPostcode,
  getUkIndex,
  type UkPostalRecord,
} from '../../../public/data/uk-postcodes/lookup';

export const unitedKingdomConfig: CountryConfig = {
  id: 'GB',
  name: 'United Kingdom',
  nativeName: 'United Kingdom',
  flag: '🇬🇧',
  isoAlpha2: 'GB',
  isoAlpha3: 'GBR',
  isoNumeric: '826',
  phoneCode: '+44',
  postalCode: {
    label: 'UK Postcode',
    length: 8,
    numeric: false,
    placeholder: 'e.g. SW1A 1AA, M1 1AE, B33 8TH',
    regex: /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i,
    validate: (val: string) => validateUKPostcode(val).valid,
    clean: (val: string) => normalizeUKPostcode(val),
  },
  presets: [
    { code: 'SW1A 1AA', label: 'Buckingham Palace', badge: 'London / Westminster', description: 'Royal residence & State Rooms, City of Westminster' },
    { code: 'SW1A 2AA', label: '10 Downing Street', badge: 'London / Whitehall', description: 'Official office of the Prime Minister, City of Westminster' },
    { code: 'M1 1AE', label: 'Piccadilly Plaza', badge: 'Manchester', description: 'Central business & retail corridor, Greater Manchester' },
    { code: 'B33 8TH', label: 'Stechford Manor Lane', badge: 'Birmingham', description: 'Residential & local logistics sector, West Midlands' },
    { code: 'EH1 1YZ', label: 'Edinburgh Castle', badge: 'Scotland / Edinburgh', description: 'Historic Castlehill landmark, City of Edinburgh' },
    { code: 'EH99 1SP', label: 'Scottish Parliament', badge: 'Scotland / Holyrood', description: 'Holyrood legislative complex, City of Edinburgh' },
    { code: 'CF10 3AT', label: 'Cardiff Castle', badge: 'Wales / Cardiff', description: 'Historic Castle Street civic quarter, Cardiff Council' },
    { code: 'CF99 1SN', label: 'Senedd Cymru', badge: 'Wales / Cardiff Bay', description: 'Welsh Parliament legislative building, Cardiff Bay' },
    { code: 'BT1 5GS', label: 'Belfast City Hall', badge: 'Northern Ireland', description: 'Donegall Square civic headquarters, County Antrim' },
    { code: 'BT4 3XX', label: 'Parliament Buildings', badge: 'Northern Ireland', description: 'Stormont Estate assembly chamber, County Down' },
    { code: 'JE2 3RP', label: 'Jersey Post HQ', badge: 'Crown Dependency', description: 'Bailiwick of Jersey postal headquarters, Saint Helier' },
    { code: 'BF1 0AA', label: 'Northwood HQ', badge: 'BFPO Military', description: 'British Forces Post Office 1, Permanent Joint Headquarters' },
  ],
  fields: [
    {
      key: 'constituentCountry',
      label: 'Constituent Country',
      placeholder: 'England, Scotland, Wales, or Northern Ireland',
      readOnly: true,
      required: true,
      order: 1,
      helpText: 'Official constituent country of the United Kingdom, or Crown Dependency',
    },
    {
      key: 'postTown',
      label: 'Post Town (Royal Mail)',
      placeholder: 'Official postal routing town (e.g. LONDON, MANCHESTER)',
      readOnly: true,
      required: true,
      order: 2,
    },
    {
      key: 'locality',
      label: 'Area / Locality',
      placeholder: 'Neighborhood or delivery locality',
      readOnly: true,
      required: false,
      order: 3,
    },
    {
      key: 'districtLocalAuthority',
      label: 'District / Local Authority',
      placeholder: 'Administrative council or borough',
      readOnly: true,
      required: false,
      order: 4,
    },
    {
      key: 'countyRegion',
      label: 'County / Region',
      placeholder: 'Ceremonial county or regional authority',
      readOnly: true,
      required: false,
      order: 5,
    },
    {
      key: 'postalCode',
      label: 'Postcode',
      placeholder: 'e.g. SW1A 1AA',
      readOnly: true,
      required: true,
      order: 6,
    },
    {
      key: 'buildingPremises',
      label: 'Building / Premises',
      placeholder: 'Building name or street number',
      readOnly: false,
      required: false,
      order: 7,
      helpText: 'Specific premises name, number, or apartment/unit',
    },
    {
      key: 'country',
      label: 'Country',
      placeholder: 'United Kingdom',
      readOnly: true,
      required: true,
      order: 8,
    },
  ],
  tableColumns: [
    {
      key: 'buildingAddress',
      label: 'Address / Premises',
      getValue: (r) => r.primaryName,
    },
    {
      key: 'postTown',
      label: 'Post Town',
      getValue: (r) => r.city,
    },
    {
      key: 'constituentCountry',
      label: 'Constituent Country',
      getValue: (r) => r.provinceState,
      badge: (r) => {
        const isBFPO = r.rawRecord?.isBFPO;
        const isCrownDep = r.rawRecord?.isCrownDependency;
        if (isBFPO) {
          return { text: 'BFPO', variant: 'warning' };
        }
        if (isCrownDep) {
          return { text: 'Crown Dep', variant: 'info' };
        }
        return { text: r.provinceState || 'Constituent Country', variant: 'success' };
      },
    },
    {
      key: 'localAuthority',
      label: 'Local Authority',
      getValue: (r) => r.districtCounty || '—',
    },
    {
      key: 'classification',
      label: 'Type',
      getValue: (r) => r.officeType || 'STANDARD',
      badge: (r) => {
        const type = r.officeType || 'STANDARD';
        let variant: 'success' | 'warning' | 'info' | 'neutral' = 'neutral';
        if (type === 'STANDARD') variant = 'success';
        else if (type === 'LARGE USER') variant = 'info';
        else if (type === 'PO BOX') variant = 'warning';
        else if (type === 'BFPO') variant = 'neutral';
        return { text: type, variant };
      },
    },
    {
      key: 'postalCode',
      label: 'Postcode',
      getValue: (r) => r.postalCode,
      badge: (r) => ({ text: r.postalCode, variant: 'neutral' }),
    },
  ],
  formatFullAddress: (record, postalCode, premises, selectedArea) => {
    const parts: string[] = [];
    if (premises.addressLine1?.trim()) parts.push(premises.addressLine1.trim());
    if (premises.addressLine2?.trim()) parts.push(premises.addressLine2.trim());

    if (record.rawRecord?.addresses && record.rawRecord.addresses.length > 0) {
      const match = record.rawRecord.addresses.find((a: any) => a.fullAddressText === selectedArea);
      if (match && !premises.addressLine1) {
        parts.push(match.fullAddressText);
        return parts.join('\n');
      }
    }

    const localityPart = selectedArea || record.area;
    if (localityPart && localityPart !== record.city && !parts.some(p => p.includes(localityPart))) {
      parts.push(localityPart);
    }

    const postTown = record.city.toUpperCase();
    parts.push(postTown);
    parts.push(postalCode);

    if (record.rawRecord?.isCrownDependency) {
      parts.push(record.rawRecord.crownDependencyName.toUpperCase());
    } else if (record.rawRecord?.isBFPO) {
      parts.push('BRITISH FORCES POST OFFICE');
    } else {
      parts.push('UNITED KINGDOM');
    }

    return parts.join('\n');
  },
  lookup: async (postalCode: string): Promise<UniversalLookupResult> => {
    const result = await lookupUKPostcode(postalCode);

    if (!result.found || result.records.length === 0) {
      return {
        found: false,
        postalCode,
        countryName: 'United Kingdom',
        records: [],
        executionTimeMs: result.executionTimeMs,
        error: result.error || 'Postcode not found in local United Kingdom dataset.',
      };
    }

    const universalRecords: UniversalPostalRecord[] = [];
    const addressLabels: string[] = [];

    result.records.forEach((r: UkPostalRecord, recIdx: number) => {
      let classification = 'STANDARD';
      if (r.isBFPO) classification = 'BFPO';
      else if (r.isPoBox) classification = 'PO BOX';
      else if (r.isLargeUserPostcode) classification = 'LARGE USER';

      const countryDisplay = r.isCrownDependency
        ? `${r.crownDependencyName} (Crown Dependency)`
        : r.constituentCountry;

      const countyDisplay = r.ceremonialCounty || r.region || '—';

      if (r.addresses && r.addresses.length > 0) {
        r.addresses.forEach((addr, addrIdx) => {
          addressLabels.push(addr.fullAddressText);
          universalRecords.push({
            id: `GB-${r.postcode.replace(/\s+/g, '')}-${recIdx}-${addrIdx}`,
            primaryName: addr.buildingName || addr.buildingNumber ? `${addr.buildingName ? addr.buildingName + ' ' : ''}${addr.buildingNumber ? addr.buildingNumber + ' ' : ''}${addr.thoroughfare || ''}`.trim() : addr.fullAddressText,
            secondaryName: addr.subBuildingName || undefined,
            area: r.locality || r.dependentLocality || r.postTown,
            city: r.postTown,
            districtCounty: r.localAuthority || countyDisplay,
            provinceState: countryDisplay,
            country: r.isCrownDependency ? r.crownDependencyName! : 'United Kingdom',
            postalCode: r.postcode,
            officeType: classification,
            deliveryStatus: 'Delivery Point',
            talukSubDistrict: r.ward ? `Ward: ${r.ward}` : undefined,
            administrativeType: r.isCrownDependency ? 'Crown Dependency' : 'Constituent Country',
            latitude: r.coordinates?.latitude || null,
            longitude: r.coordinates?.longitude || null,
            rawRecord: {
              ...r,
              selectedAddress: addr,
            },
          });
        });
      } else {
        universalRecords.push({
          id: `GB-${r.postcode.replace(/\s+/g, '')}-${recIdx}`,
          primaryName: r.locality || r.postTown,
          secondaryName: r.localAuthority || undefined,
          area: r.locality || r.dependentLocality || r.postTown,
          city: r.postTown,
          districtCounty: r.localAuthority || countyDisplay,
          provinceState: countryDisplay,
          country: r.isCrownDependency ? r.crownDependencyName! : 'United Kingdom',
          postalCode: r.postcode,
          officeType: classification,
          deliveryStatus: 'Delivery Point',
          administrativeType: r.isCrownDependency ? 'Crown Dependency' : 'Constituent Country',
          latitude: r.coordinates?.latitude || null,
          longitude: r.coordinates?.longitude || null,
          rawRecord: r,
        });
      }
    });

    return {
      found: true,
      postalCode: result.normalizedPostcode || postalCode,
      countryName: 'United Kingdom',
      records: universalRecords,
      areas: addressLabels.length > 0 ? addressLabels : [result.primaryRecord?.locality || result.primaryRecord?.postTown || 'Standard Delivery'],
      defaultArea: addressLabels[0] || result.primaryRecord?.locality || result.primaryRecord?.postTown,
      executionTimeMs: result.executionTimeMs,
    };
  },
  getDatasetStats: async (): Promise<DatasetStats> => {
    try {
      const index = await getUkIndex();
      return {
        countryName: 'United Kingdom',
        summaryTitle: '4 Constituent Countries, Crown Dependencies, & BFPO',
        divisionCountStr: `${index.constituentCountries.length} Constituent Countries (${index.crownDependencies.length} Crown Dep, BFPO)`,
        postalCodeCountStr: `${index.statistics.uniquePostcodes} Verified Postcodes`,
        officeCountStr: `${index.statistics.totalAddressRecords} Address Premises`,
        sourceAttribution: 'Office for National Statistics (NSPL) & Ordnance Survey (Code-Point Open)',
        statusText: '100% Offline Local Intelligence',
      };
    } catch {
      return {
        countryName: 'United Kingdom',
        summaryTitle: '4 Constituent Countries & Dependencies',
        divisionCountStr: '4 Constituent Countries',
        postalCodeCountStr: '40 Verified Postcodes',
        officeCountStr: '48 Address Premises',
        sourceAttribution: 'ONS & Ordnance Survey OpenData',
        statusText: '100% Local Dataset',
      };
    }
  },
};
