/**
 * NEDRÄKNING FÖR PROVSIMULERINGEN
 *
 * Klockan räknar mot en fast sluttid (deadline) i stället för att räkna ner en
 * sekund i taget. Då blir tiden rätt även om mobilen låser skärmen, fliken
 * ligger i bakgrunden eller sidan laddas om.
 */

/** Millisekunder kvar, aldrig mindre än 0. */
export function remainingMs(deadline: number, now: number): number {
  return Math.max(0, deadline - now);
}

export function isTimeUp(deadline: number, now: number): boolean {
  return remainingMs(deadline, now) === 0;
}

/**
 * Visar tiden som "1:29:59" (minst en timme kvar) eller "29:59".
 * Avrundar uppåt, så att klockan visar "0:01" ända tills tiden verkligen är slut.
 */
export function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${ss}`;
  return `${minutes}:${ss}`;
}

/** Hur bråttom det är: normal, under 10 minuter eller under 1 minut. */
export function timeWarning(ms: number): "normal" | "low" | "critical" {
  if (ms <= 60_000) return "critical";
  if (ms <= 10 * 60_000) return "low";
  return "normal";
}

/** Använd tid i hela sekunder, högst tidsgränsen. */
export function usedSeconds(startedAt: number, finishedAt: number, limitSeconds: number): number {
  return Math.min(limitSeconds, Math.max(0, Math.round((finishedAt - startedAt) / 1000)));
}
