/**
 * SIDVISNINGAR – gemensam logik för webbläsaren, servern och statistiksidan.
 *
 * Integritet: vi sparar bara sidans adress (utan ?-parametrar), ordningen i besöket,
 * aktiv tid och språk. Besöks-id:t slumpas och finns bara i flikens minne – inga
 * cookies, ingen localStorage, ingen IP-adress. Därför behövs ingen cookie-banner.
 */

/** Sidor som inte räknas: admin, inloggning, API och offline-sidan. */
const SKIP = /^\/(admin|auth|api|offline)(\/|$)/;

export function shouldTrackPath(pathname: string): boolean {
  return pathname.startsWith("/") && !SKIP.test(pathname);
}

/**
 * Gör adressen jämförbar: tar bort ?-parametrar och avslutande snedstreck och
 * slår ihop alla enskilda frågesidor till /fraga/[id].
 */
export function normalizePath(pathname: string): string {
  let p = pathname.split(/[?#]/)[0] || "/";
  if (p.length > 1) p = p.replace(/\/+$/, "");
  p = p.replace(/^\/fraga\/[^/]+/, "/fraga/[id]");
  return p.slice(0, 200) || "/";
}

/** Robotar och sökmotorer räknas inte. User-agent sparas aldrig, den läses bara här. */
export function isBot(userAgent: string | null): boolean {
  return !userAgent || /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|curl|wget|python/i.test(userAgent);
}

export const MAX_DURATION_MS = 30 * 60 * 1000;

// ---------------------------------------------------------------------------
// Beräkningar för statistiksidan
// ---------------------------------------------------------------------------

export type PageViewRow = {
  visit_id: string;
  seq: number;
  path: string;
  duration_ms: number | null;
  created_at: string;
};

export type Visit = { id: string; start: string; pages: PageViewRow[]; durationMs: number | null };

/** Grupperar sidvisningarna per besök, sorterade i den ordning sidorna visades. */
export function groupVisits(rows: PageViewRow[]): Visit[] {
  const map = new Map<string, PageViewRow[]>();
  for (const r of rows) {
    const list = map.get(r.visit_id) ?? [];
    list.push(r);
    map.set(r.visit_id, list);
  }
  return [...map.entries()].map(([id, pages]) => {
    pages.sort((a, b) => a.seq - b.seq);
    const timed = pages.filter((p) => p.duration_ms !== null);
    return {
      id,
      start: pages.reduce((min, p) => (p.created_at < min ? p.created_at : min), pages[0].created_at),
      pages,
      durationMs: timed.length ? timed.reduce((s, p) => s + (p.duration_ms ?? 0), 0) : null,
    };
  });
}

export function average(values: number[]): number | null {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** "1 min 05 s" eller "42 s". */
export function formatDuration(ms: number | null): string {
  if (ms === null) return "–";
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec} s`;
  return `${Math.floor(sec / 60)} min ${String(sec % 60).padStart(2, "0")} s`;
}

export type Summary = {
  visits: number;
  pageViews: number;
  avgVisitMs: number | null;
  medianVisitMs: number | null;
  /** Andel besök där bara en sida visades (0–1). */
  bounceRate: number | null;
};

export function summarize(visits: Visit[]): Summary {
  const durations = visits.map((v) => v.durationMs).filter((d): d is number => d !== null);
  return {
    visits: visits.length,
    pageViews: visits.reduce((s, v) => s + v.pages.length, 0),
    avgVisitMs: average(durations),
    medianVisitMs: median(durations),
    bounceRate: visits.length ? visits.filter((v) => v.pages.length === 1).length / visits.length : null,
  };
}

/** Besök och sidvisningar per dag (svensk tid), nyaste dagen först. */
export function perDay(visits: Visit[], timeZone = "Europe/Stockholm"): { day: string; visits: number; pageViews: number }[] {
  const fmt = new Intl.DateTimeFormat("sv-SE", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const map = new Map<string, { visits: number; pageViews: number }>();
  for (const v of visits) {
    const day = fmt.format(new Date(v.start));
    const d = map.get(day) ?? { visits: 0, pageViews: 0 };
    d.visits += 1;
    d.pageViews += v.pages.length;
    map.set(day, d);
  }
  return [...map.entries()].map(([day, d]) => ({ day, ...d })).sort((a, b) => b.day.localeCompare(a.day));
}

export type PageRow = {
  path: string;
  views: number;
  /** Antal besök som slutade på sidan. */
  exits: number;
  /** Antal besök som började på sidan. */
  entries: number;
  avgMs: number | null;
};

/** Statistik per sida, sorterad efter antal visningar. */
export function perPage(visits: Visit[]): PageRow[] {
  const map = new Map<string, { views: number; exits: number; entries: number; durations: number[] }>();
  const get = (path: string) => {
    const p = map.get(path) ?? { views: 0, exits: 0, entries: 0, durations: [] };
    map.set(path, p);
    return p;
  };
  for (const v of visits) {
    for (const p of v.pages) {
      const row = get(p.path);
      row.views += 1;
      if (p.duration_ms !== null) row.durations.push(p.duration_ms);
    }
    get(v.pages[0].path).entries += 1;
    get(v.pages[v.pages.length - 1].path).exits += 1;
  }
  return [...map.entries()]
    .map(([path, p]) => ({ path, views: p.views, exits: p.exits, entries: p.entries, avgMs: average(p.durations) }))
    .sort((a, b) => b.views - a.views || a.path.localeCompare(b.path));
}

/** Antal besök där någon sida börjar med prefixet (t.ex. "/ova/gratis"). */
export function visitsReaching(visits: Visit[], prefix: string): number {
  const match = (path: string) => path === prefix || path.startsWith(`${prefix}/`);
  return visits.filter((v) => v.pages.some((p) => match(p.path))).length;
}

export type FunnelStep = { label: string; count: number };
export type FunnelRow = FunnelStep & { ofFirst: number | null; ofPrevious: number | null };

/** Räknar ut andelar för tratten: av första steget och av föregående steg. */
export function funnel(steps: FunnelStep[]): FunnelRow[] {
  const first = steps[0]?.count ?? 0;
  return steps.map((s, i) => ({
    ...s,
    ofFirst: first ? s.count / first : null,
    ofPrevious: i === 0 ? null : steps[i - 1].count ? s.count / steps[i - 1].count : null,
  }));
}

/** Steget där störst andel försvinner (jämfört med föregående steg). */
export function biggestDrop(rows: FunnelRow[]): { from: string; to: string; kept: number } | null {
  let worst: { from: string; to: string; kept: number } | null = null;
  for (let i = 1; i < rows.length; i++) {
    const kept = rows[i].ofPrevious;
    if (kept === null || rows[i - 1].count < 5) continue; // för lite data för att säga något
    if (!worst || kept < worst.kept) worst = { from: rows[i - 1].label, to: rows[i].label, kept };
  }
  return worst;
}
