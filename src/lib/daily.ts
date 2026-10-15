/**
 * DAGENS FRÅGA
 * Samma fråga hela dagen (svensk tid), och en ny varje dag i tur och ordning.
 */
export function dayNumber(date: Date, timeZone: string): number {
  const key = new Intl.DateTimeFormat("sv-SE", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  return Math.floor(Date.parse(`${key}T00:00:00Z`) / 86_400_000);
}

export function pickDaily<T extends { id: string }>(pool: T[], date: Date, timeZone: string): T | null {
  if (pool.length === 0) return null;
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  return sorted[dayNumber(date, timeZone) % sorted.length];
}
