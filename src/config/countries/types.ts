/**
 * Multi-Country Postal & Address SaaS Architecture
 * =================================================
 * Location: src/config/countries/types.ts
 *
 * Defines the contract for country metadata, postal rules,
 * address field configurations, and local dataset lookup adapters.
 */

export type CountryId = 'IN' | 'CN' | 'AF' | 'EG' | 'KR' | 'US' | 'GB' | 'JP' | 'ID' | 'MY' | 'LK' | 'VN' | 'CA';

export interface PostalCodeConfig {
  label: string;
  length: number;
  numeric: boolean;
  placeholder: string;
  regex: RegExp;
  validate: (val: string) => boolean;
  clean: (val: string) => string;
}

export interface AddressFieldConfig {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  readOnly?: boolean;
  type?: 'text' | 'select';
  helpText?: string;
  order: number;
}

export interface TableColumnConfig {
  key: string;
  label: string;
  getValue: (record: UniversalPostalRecord) => string;
  badge?: (record: UniversalPostalRecord) => {
    text: string;
    variant: 'success' | 'warning' | 'info' | 'neutral';
  } | null;
}

export interface UniversalPostalRecord {
  id: string;
  primaryName: string;
  secondaryName?: string;
  area: string;
  city: string;
  districtCounty: string;
  provinceState: string;
  country: string;
  postalCode: string;
  officeType?: string;
  deliveryStatus?: string;
  phone?: string;
  email?: string;
  talukSubDistrict?: string;
  administrativeType?: string;
  latitude?: number | null;
  longitude?: number | null;
  rawRecord: any;
}

export interface UniversalLookupResult {
  found: boolean;
  postalCode: string;
  countryName: string;
  records: UniversalPostalRecord[];
  areas?: string[];
  defaultArea?: string;
  executionTimeMs: number;
  error?: string;
}

export interface DatasetStats {
  countryName: string;
  summaryTitle: string;
  divisionCountStr: string;
  postalCodeCountStr: string;
  officeCountStr: string;
  sourceAttribution: string;
  statusText: string;
}

export interface CountryConfig {
  id: CountryId;
  name: string;
  nativeName: string;
  flag: string;
  isoAlpha2: string;
  isoAlpha3: string;
  isoNumeric: string;
  phoneCode: string;
  postalCode: PostalCodeConfig;
  presets: Array<{ code: string; label: string; badge: string; description?: string }>;
  fields: AddressFieldConfig[];
  tableColumns: TableColumnConfig[];
  formatFullAddress: (
    record: UniversalPostalRecord,
    postalCode: string,
    premises: { addressLine1: string; addressLine2: string },
    selectedArea?: string
  ) => string;
  lookup: (code: string) => Promise<UniversalLookupResult>;
  getDatasetStats: () => Promise<DatasetStats>;
}
