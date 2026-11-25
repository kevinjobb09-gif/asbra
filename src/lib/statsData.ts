import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { funnel, groupVisits, perDay, perPage, summarize, visitsReaching, type PageViewRow } from "@/lib/pageViews";

/**
 * Hämtar och räknar statistiken för de senaste dagarna. Används av adminsidan (/admin/statistik) och av
 * /api/oversikt, som den samlade översikten över Kevins sajter (fiskkartan.se/admin/oversikt) läser.
 * Inga personuppgifter: bara sidvisningar, händelser och betalningarnas antal och belopp.
 */
export async function loadStats(dagar: string | null | undefined) {
  const requested = Number(dagar);
  const days = [3, 7, 30, 90].includes(requested) ? requested : 30;
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const db = createAdminClient();
  const [eventsRes, viewsRes, paymentsRes] = await Promise.all([
    db.from("analytics_events").select("name, language, ref_code, created_at").gte("created_at", since).limit(50_000),
    db
      .from("page_views")
      .select("visit_id, seq, path, duration_ms, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(100_000),
    db.from("payments").select("amount_minor, currency").gte("paid_at", since).limit(50_000),
  ]);
  const events = eventsRes.data ?? [];
  const visits = groupVisits((viewsRes.data ?? []) as PageViewRow[]);
  const summary = summarize(visits);
  const days_ = perDay(visits);
  const pages = perPage(visits);
  const count = (name: string) => events.filter((r) => r.name === name).length;

  const steps = funnel([
    { label: "Besök på sajten", count: summary.visits },
    { label: "Såg gratisfrågorna", count: visitsReaching(visits, "/ova/gratis") },
    { label: "Skrev e-post", count: count("free_email") },
    { label: "Startade gratisövning", count: count("free_started") },
    { label: "Avslutade gratisövning", count: count("free_finished") },
    { label: "Såg köpsidan", count: visitsReaching(visits, "/kop") },
    { label: "Öppnade betalning", count: count("checkout_opened") },
    { label: "Betalade", count: count("paid") },
  ]);
  const payments = paymentsRes.data ?? [];
  const error = eventsRes.error?.message ?? viewsRes.error?.message ?? paymentsRes.error?.message;
  return { days, events, visits, summary, days_, pages, steps, payments, error };
}

/** Översikten loggar in med nyckeln i OVERSIKT_NYCKEL (samma värde på alla sajterna). Utan nyckel finns inte adressen. */
export function hasOverviewKey(request: Request): boolean {
  const key = process.env.OVERSIKT_NYCKEL;
  if (!key || key.length < 20) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${key}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
