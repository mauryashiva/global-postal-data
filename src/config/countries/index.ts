import type { CountryId, CountryConfig } from './types';
import { indiaConfig } from './india';
import { chinaConfig } from './china';
import { afghanistanConfig } from './afghanistan';
import { egyptConfig } from './egypt';
import { southKoreaConfig } from './south-korea';
import { unitedStatesConfig } from './united-states';
import { unitedKingdomConfig } from './united-kingdom';
import { japanConfig } from './japan';
import { indonesiaConfig } from './indonesia';
import { malaysiaConfig } from './malaysia';
import { sriLankaConfig } from './sri-lanka';
import { vietnamConfig } from './vietnam';
import { canadaConfig } from './canada';

export * from './types';
export { indiaConfig } from './india';
export { chinaConfig } from './china';
export { afghanistanConfig } from './afghanistan';
export { egyptConfig } from './egypt';
export { southKoreaConfig } from './south-korea';
export { unitedStatesConfig } from './united-states';
export { unitedKingdomConfig } from './united-kingdom';
export { japanConfig } from './japan';
export { indonesiaConfig } from './indonesia';
export { malaysiaConfig } from './malaysia';
export { sriLankaConfig } from './sri-lanka';
export { vietnamConfig } from './vietnam';
export { canadaConfig } from './canada';

export const AVAILABLE_COUNTRIES: CountryConfig[] = [
  indiaConfig,
  chinaConfig,
  afghanistanConfig,
  egyptConfig,
  southKoreaConfig,
  unitedStatesConfig,
  unitedKingdomConfig,
  japanConfig,
  indonesiaConfig,
  malaysiaConfig,
  sriLankaConfig,
  vietnamConfig,
  canadaConfig,
];

export const DEFAULT_COUNTRY: CountryConfig = indiaConfig;

export function getCountryConfig(id: CountryId | string): CountryConfig {
  const found = AVAILABLE_COUNTRIES.find((c) => c.id === id || c.isoAlpha2 === id);
  return found || DEFAULT_COUNTRY;
}

