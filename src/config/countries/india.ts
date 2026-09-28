import type { CountryConfig, UniversalPostalRecord, UniversalLookupResult, DatasetStats } from './types';
import {
  lookupPincode,
  validatePincode,
  cleanPincode,
  extractAreaName,
  getPincodeIndex,
  type PostOffice
} from '../../../public/data/india-pincodes/lookup';

export const indiaConfig: CountryConfig = {
  id: 'IN',
  name: 'India',
  nativeName: 'भारत',
  flag: '🇮🇳',
  isoAlpha2: 'IN',
  isoAlpha3: 'IND',
  isoNumeric: '356',
  phoneCode: '+91',
  postalCode: {
    label: 'Pincode',
    length: 6,
    numeric: true,
    placeholder: 'e.g. 401209 or 400001',
    regex: /^[0-9]{6}$/,
    validate: validatePincode,
    clean: cleanPincode,
  },
  presets: [
    { code: '401209', label: 'Nalasopara East', badge: 'Palghar, MH', description: 'Single PO delivering to 6 distinct neighborhoods' },
    { code: '400001', label: 'Mumbai GPO', badge: 'Maharashtra', description: '6 Metro post offices under one PIN' },
    { code: '110001', label: 'Connaught Place', badge: 'New Delhi', description: '23 Central New Delhi post offices' },
    { code: '560038', label: 'Indiranagar', badge: 'Bengaluru, KA', description: '7 Tech hub urban neighborhoods' },
    { code: '194101', label: 'Leh Ladakh', badge: 'Ladakh (UT)', description: 'High altitude Himalayan territory' },
    { code: '396210', label: 'Daman Market', badge: 'DNH & DD (UT)', description: 'Union Territory coastal delivery' },
    { code: '682555', label: 'Kavaratti', badge: 'Lakshadweep (UT)', description: 'Arabian Sea island territory' },
    { code: '800001', label: 'Patna Central', badge: 'Bihar', description: '18 Post offices in state capital' },
  ],
  fields: [
    { key: 'area', label: 'Area / Neighborhood', placeholder: 'Auto-populated area name', readOnly: true, required: true, order: 1, helpText: 'Neighborhood, colony, or village' },
    { key: 'postOffice', label: 'Post Office Branch', placeholder: 'Select a post office branch', readOnly: true, required: true, order: 2 },
    { key: 'cityTown', label: 'City / Town', placeholder: 'Auto-populated city', readOnly: true, required: true, order: 3 },
    { key: 'district', label: 'District', placeholder: 'Auto-populated district', readOnly: true, required: true, order: 4 },
    { key: 'talukSubDistrict', label: 'Taluk / Sub-District / Tehsil', placeholder: 'Auto-populated taluk', readOnly: true, required: false, order: 5 },
    { key: 'stateUT', label: 'State / Union Territory', placeholder: 'Auto-populated state', readOnly: true, required: true, order: 6 },
    { key: 'country', label: 'Country', placeholder: 'India', readOnly: true, required: true, order: 7 },
  ],
  tableColumns: [
    {
      key: 'area',
      label: 'Area / Locality',
      getValue: (r) => r.area,
    },
    {
      key: 'postOffice',
      label: 'Post Office',
      getValue: (r) => r.primaryName,
    },
    {
      key: 'officeType',
      label: 'Type',
      getValue: (r) => r.officeType || '—',
      badge: (r) => ({ text: r.officeType || 'PO', variant: 'neutral' }),
    },
    {
      key: 'deliveryStatus',
      label: 'Delivery',
      getValue: (r) => r.deliveryStatus || '—',
      badge: (r) => ({
        text: r.deliveryStatus || 'Unknown',
        variant: r.deliveryStatus === 'Delivery' ? 'success' : 'warning',
      }),
    },
    {
      key: 'taluk',
      label: 'Taluk / Tehsil',
      getValue: (r) => r.talukSubDistrict || '—',
    },
    {
      key: 'district',
      label: 'District',
      getValue: (r) => r.districtCounty,
    },
    {
      key: 'phone',
      label: 'Phone',
      getValue: (r) => r.phone || '—',
    },
  ],
  formatFullAddress: (record, postalCode, premises, selectedArea) => {
    const areaName = selectedArea || record.area;
    const lines = [
      premises.addressLine1.trim(),
      premises.addressLine2.trim(),
      `Area: ${areaName}`,
      record.primaryName !== areaName ? `Post Office: ${record.primaryName}` : '',
      record.talukSubDistrict ? `Taluk: ${record.talukSubDistrict}` : '',
      `${record.city}, ${record.districtCounty}`,
      `${record.provinceState} - ${postalCode}`,
      'India',
    ].filter(Boolean);
    return lines.join('\n');
  },
  lookup: async (code: string): Promise<UniversalLookupResult> => {
    const t0 = performance.now();
    const res = await lookupPincode(code);
    const ms = parseFloat((performance.now() - t0).toFixed(2));

    if (!res.found || !res.postOffices || res.postOffices.length === 0) {
      return {
        found: false,
        postalCode: code,
        countryName: 'India',
        records: [],
        executionTimeMs: ms,
        error: res.error || `No post office found for Pincode ${code}`,
      };
    }

    const universalRecords: UniversalPostalRecord[] = res.postOffices.map((po: PostOffice) => {
      const area = extractAreaName(po.officeName);
      return {
        id: `${po.officeName}-${code}`,
        primaryName: po.officeName,
        secondaryName: po.officeType,
        area: area,
        city: po.cityVillage || po.taluk || po.district,
        districtCounty: po.district,
        provinceState: po.state,
        country: 'India',
        postalCode: code,
        officeType: po.officeType,
        deliveryStatus: po.deliveryStatus,
        phone: po.phone,
        email: po.email,
        talukSubDistrict: po.taluk || po.subDistrict,
        latitude: po.latitude,
        longitude: po.longitude,
        rawRecord: po,
      };
    });

    return {
      found: true,
      postalCode: code,
      countryName: 'India',
      records: universalRecords,
      areas: res.areas,
      defaultArea: res.defaultArea,
      executionTimeMs: ms,
    };
  },
  getDatasetStats: async (): Promise<DatasetStats> => {
    try {
      const index = await getPincodeIndex();
      return {
        countryName: 'India',
        summaryTitle: 'Official India Post Directory',
        divisionCountStr: `${index.stats.statesCount} States · ${index.stats.unionTerritoriesCount} Union Territories`,
        postalCodeCountStr: `${index.stats.uniquePincodes.toLocaleString()} Unique Pincodes`,
        officeCountStr: `${index.stats.totalPostOffices.toLocaleString()} Post Offices & Villages`,
        sourceAttribution: 'Department of Posts, Ministry of Communications, Govt. of India (OGD)',
        statusText: '100% Local JSON · 0 External APIs',
      };
    } catch {
      return {
        countryName: 'India',
        summaryTitle: 'Official India Post Directory',
        divisionCountStr: '28 States · 8 Union Territories',
        postalCodeCountStr: '19,586 Unique Pincodes',
        officeCountStr: '165,595 Post Offices',
        sourceAttribution: 'Department of Posts, Govt. of India',
        statusText: '100% Local JSON',
      };
    }
  },
};
