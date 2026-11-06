import { describe, expect, it } from "vitest";
import {
  biggestDrop,
  formatDuration,
  funnel,
  groupVisits,
  isBot,
  normalizePath,
  perDay,
  perPage,
  shouldTrackPath,
  summarize,
  visitsReaching,
  type PageViewRow,
} from "@/lib/pageViews";

/** Skapar ett besök med sidor i ordning. Tid i sekunder (null = okänd). */
function visit(id: string, start: string, pages: [string, number | null][]): PageViewRow[] {
  return pages.map(([path, sec], i) => ({
    visit_id: id,
    seq: i + 1,
    path,
    duration_ms: sec === null ? null : sec * 1000,
    created_at: new Date(new Date(start).getTime() + i * 1000).toISOString(),
  }));
}

const rows = [
  ...visit("a", "2026-11-05T10:00:00Z", [["/", 10], ["/ova/gratis", 50], ["/kop", 20]]),
  ...visit("b", "2026-11-05T12:00:00Z", [["/", 5]]),
  ...visit("c", "2026-11-06T09:00:00Z", [["/guide", null], ["/ova/gratis", 30]]),
];
const visits = groupVisits(rows);

describe("sidvisningar", () => {
  it("räknar inte admin, inloggning och API", () => {
    expect(shouldTrackPath("/")).toBe(true);
    expect(shouldTrackPath("/ova/gratis")).toBe(true);
    expect(shouldTrackPath("/admin/statistik")).toBe(false);
    expect(shouldTrackPath("/auth/callback")).toBe(false);
    expect(shouldTrackPath("/api/sidvisning")).toBe(false);
    expect(shouldTrackPath("/administratör")).toBe(true);
  });

  it("tar bort parametrar och slår ihop frågesidor", () => {
    expect(normalizePath("/ova/gratis?kod=skickad")).toBe("/ova/gratis");
    expect(normalizePath("/kop/")).toBe("/kop");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("/fraga/123e4567-e89b-12d3-a456-426614174000")).toBe("/fraga/[id]");
  });

  it("känner igen robotar", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1")).toBe(false);
  });

  it("sammanfattar besök, tid och studsar", () => {
    const s = summarize(visits);
    expect(s.visits).toBe(3);
    expect(s.pageViews).toBe(6);
    expect(s.avgVisitMs).toBe(((80 + 5 + 30) / 3) * 1000);
    expect(s.medianVisitMs).toBe(30_000);
    expect(s.bounceRate).toBeCloseTo(1 / 3);
  });

  it("räknar besök per dag i svensk tid", () => {
    expect(perDay(visits)).toEqual([
      { day: "2026-11-06", visits: 1, pageViews: 2 },
      { day: "2026-11-05", visits: 2, pageViews: 4 },
    ]);
  });

  it("hittar utgångs- och startsidor", () => {
    const pages = Object.fromEntries(perPage(visits).map((p) => [p.path, p]));
    expect(pages["/"]).toMatchObject({ views: 2, entries: 2, exits: 1, avgMs: 7500 });
    expect(pages["/ova/gratis"]).toMatchObject({ views: 2, exits: 1 });
    expect(pages["/kop"]).toMatchObject({ exits: 1 });
    expect(pages["/guide"]).toMatchObject({ entries: 1, avgMs: null });
  });

  it("räknar besök som nådde ett steg", () => {
    expect(visitsReaching(visits, "/ova/gratis")).toBe(2);
    expect(visitsReaching(visits, "/kop")).toBe(1);
    expect(visitsReaching(visits, "/ko")).toBe(0);
  });

  it("räknar tratten och hittar största tappet", () => {
    const f = funnel([
      { label: "Besök", count: 100 },
      { label: "Gratis", count: 40 },
      { label: "E-post", count: 10 },
      { label: "Betalade", count: 0 },
    ]);
    expect(f[1]).toMatchObject({ ofFirst: 0.4, ofPrevious: 0.4 });
    expect(f[0].ofPrevious).toBeNull();
    // E-post → Betalade (0 %) är störst, men E-post har 10 ≥ 5 så det räknas.
    expect(biggestDrop(f)).toEqual({ from: "E-post", to: "Betalade", kept: 0 });
    expect(biggestDrop(funnel([{ label: "A", count: 3 }, { label: "B", count: 0 }]))).toBeNull();
  });

  it("visar tid läsbart", () => {
    expect(formatDuration(null)).toBe("–");
    expect(formatDuration(42_000)).toBe("42 s");
    expect(formatDuration(65_000)).toBe("1 min 05 s");
  });
});
