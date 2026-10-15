import { se } from "./countries/se";
import type { CountryCode, CountryConfig } from "./countries/types";

export { brand } from "./brand";
export { languages, isRtl } from "./languages";
export type { LanguageCode, Language } from "./languages";
export type { CountryCode, CountryConfig, Chapter } from "./countries/types";

/** Alla länder som tjänsten har innehåll för. Lägg till `fi` här senare. */
export const countries: Record<CountryCode, CountryConfig> = { se };

/** Landet som visas utåt. Just nu bara Sverige. */
export const ACTIVE_COUNTRY: CountryCode = "se";

export function getCountry(code: CountryCode = ACTIVE_COUNTRY): CountryConfig {
  return countries[code];
}

/** Formaterar ett pris, t.ex. "149 kr". */
export function formatPrice(country: CountryConfig = getCountry()): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: country.currency,
    maximumFractionDigits: 0,
  }).format(country.pricing.amount);
}
