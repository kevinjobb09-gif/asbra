import { NextResponse, type NextRequest } from "next/server";
import { hasOverviewKey, loadStats } from "@/lib/statsData";

export const dynamic = "force-dynamic";

/**
 * Nyckeltalen som JSON till den samlade översikten över Kevins sajter (fiskkartan.se/admin/oversikt).
 * Samma beräkning som /admin/statistik. Bara antal och summor, inga personuppgifter.
 */
export async function GET(request: NextRequest) {
  if (!hasOverviewKey(request)) return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  const s = await loadStats(request.nextUrl.searchParams.get("dagar"));
  const sek = s.payments.filter((p) => p.currency.toUpperCase() === "SEK");
  return NextResponse.json(
    {
      namn: "Medborgarhjälpen",
      adress: `${request.nextUrl.origin}/admin/statistik`,
      dagar: s.days,
      besok: s.summary.visits,
      sidvisningar: s.summary.pageViews,
      snittMs: s.summary.avgVisitMs,
      medianMs: s.summary.medianVisitMs,
      studs: s.summary.bounceRate,
      tratt: s.steps.map((x) => ({ namn: x.label, antal: x.count })),
      trattFran: null,
      kop: { antal: s.payments.length, summa: sek.reduce((sum, p) => sum + p.amount_minor, 0) / 100, valuta: "kr" },
      perDag: s.days_.map((d) => ({ dag: d.day, besok: d.visits, vyer: d.pageViews })),
      fel: s.error,
    },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
  );
}
