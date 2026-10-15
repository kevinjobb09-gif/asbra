/**
 * PRIS, RABATT, PROVISION OCH TILLGÅNGSTID
 * Rena funktioner som testas i tests/payments.test.ts.
 */

/** Stripe kräver minst 3 kr per betalning i SEK. */
export const MIN_AMOUNT_MINOR = 300;

/**
 * Pris efter rabatt, avrundat till hela kronor. Belopp anges i öre ("minor units"),
 * som Stripe vill ha dem.
 */
export function computePrice(listPriceKr: number, discountPercent: number) {
  const discount = clampPercent(discountPercent, 90);
  const listPriceMinor = Math.round(listPriceKr * 100);
  const amountKr = Math.round(listPriceKr * (1 - discount / 100));
  const amountMinor = Math.max(MIN_AMOUNT_MINOR, amountKr * 100);
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

/**
 * Lägger till månader. Om dagen inte finns i målmånaden blir det sista dagen
 * i månaden (31 jan + 1 månad = 28/29 feb).
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

/**
 * Ny sluttid för tillgången. Har man redan tillgång förlängs den från den
 * nuvarande sluttiden, så att man aldrig förlorar dagar på att köpa igen.
 */
export function accessExpiry(now: Date, currentExpiry: Date | null, months: number): Date {
  const start = currentExpiry && currentExpiry > now ? currentExpiry : now;
  return addMonths(start, months);
}

/** Normaliserar en rabattkod från en länk: små bokstäver, bara tillåtna tecken. */
export function normalizeRefCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toLowerCase();
  return /^[a-z0-9_-]{2,40}$/.test(code) ? code : null;
}
