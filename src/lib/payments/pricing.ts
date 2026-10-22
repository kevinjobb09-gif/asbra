/**
 * PRIS, RABATT OCH PROVISION
 * Rena funktioner som testas i tests/payments.test.ts.
 */

/** Stripe kräver minst 3 kr per betalning i SEK. */
export const MIN_AMOUNT_MINOR = 300;

/**
 * Pris efter rabatt, exakt på öret. Belopp anges i öre ("minor units"),
 * som Stripe vill ha dem.
 */
export function computePrice(listPriceKr: number, discountPercent: number) {
  const discount = clampPercent(discountPercent, 90);
  const listPriceMinor = Math.round(listPriceKr * 100);
  // Exakt på öret – samma belopp som Stripe drar med procentkupongen.
  const amountMinor = Math.max(MIN_AMOUNT_MINOR, Math.round(listPriceMinor * (1 - discount / 100)));
  return { listPriceMinor, amountMinor, discountMinor: listPriceMinor - amountMinor, discountPercent: discount };
}

/** Partnerns provision på det betalda beloppet, avrundat nedåt till hela öre. */
export function commissionMinor(amountMinor: number, commissionPercent: number): number {
  return Math.floor((amountMinor * clampPercent(commissionPercent, 100)) / 100);
}

function clampPercent(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(max, Math.max(0, Math.round(value)));
}

/** Normaliserar en rabattkod från en länk: små bokstäver, bara tillåtna tecken. */
export function normalizeRefCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toLowerCase();
  return /^[a-z0-9_-]{2,40}$/.test(code) ? code : null;
}
