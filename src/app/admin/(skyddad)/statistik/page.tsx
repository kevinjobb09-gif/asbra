import { languages, isLanguageCode } from "@/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  biggestDrop,
  formatDuration,
  funnel,
  groupVisits,
  perDay,
  perPage,
  summarize,
  visitsReaching,
  type PageViewRow,
} from "@/lib/pageViews";

const EVENTS = [
  { name: "free_email", label: "Skrev e-post" },
  { name: "free_started", label: "Startade gratisövning" },
  { name: "free_finished", label: "Avslutade gratisövning" },
  { name: "checkout_opened", label: "Öppnade betalning" },
  { name: "paid", label: "Betalade" },
] as const;

/** Lättlästa namn på de vanligaste sidorna. */
const PAGE_NAMES: Record<string, string> = {
  "/": "Startsidan",
  "/ova/gratis": "Gratisfrågorna",
  "/ova": "Öva (betald)",
  "/prov": "Provet",
  "/kop": "Köpsidan",
  "/kop/klart": "Köp klart",
  "/rabatt": "Rabatt",
  "/guide": "Guiden",
  "/om": "Om tjänsten",
  "/kontakt": "Kontakt",
  "/konto": "Konto",
  "/logga-in": "Logga in",
  "/resultat": "Resultat",
  "/repetera": "Repetera fel",
  "/dagens-fraga": "Dagens fråga",
  "/fraga/[id]": "Enskild fråga (delad länk)",
  "/integritet": "Integritetspolicy",
  "/villkor": "Villkor",
};
const pageName = (path: string) => PAGE_NAMES[path] ?? (isLanguageCode(path.slice(1)) ? `Språksida: ${languages[path.slice(1) as keyof typeof languages].swedishName}` : null);

/** Tidpunkt för N dagar sedan (räknas när sidan hämtas på servern). */
function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

const pct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)} %`);

type Props = { searchParams: Promise<{ dagar?: string }> };

/** Integritetsvänlig statistik: besök, tid, utgångssidor och tratten. Bara för admin (skyddat av layouten). */
export default async function StatsPage({ searchParams }: Props) {
  const requested = Number((await searchParams).dagar);
  const days = [7, 30, 90].includes(requested) ? requested : 30;
  const since = daysAgoIso(days);
  const db = createAdminClient();
  const [eventsRes, viewsRes] = await Promise.all([
    db.from("analytics_events").select("name, language, ref_code, created_at").gte("created_at", since).limit(50_000),
    db
      .from("page_views")
      .select("visit_id, seq, path, duration_ms, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(100_000),
  ]);
  const events = eventsRes.data ?? [];
  const visits = groupVisits((viewsRes.data ?? []) as PageViewRow[]);
  const summary = summarize(visits);
  const days_ = perDay(visits);
  const pages = perPage(visits);
  const exits = [...pages].sort((a, b) => b.exits - a.exits).filter((p) => p.exits > 0).slice(0, 10);
  const entries = [...pages].sort((a, b) => b.entries - a.entries).filter((p) => p.entries > 0).slice(0, 10);
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
  const drop = biggestDrop(steps);
  const maxDay = Math.max(1, ...days_.map((d) => d.visits));

  // Händelser per språk och per kod
  const group = (key: "language" | "ref_code") => {
    const m = new Map<string, Record<string, number>>();
    for (const r of events) {
      const k = r[key] ?? "–";
      const g = m.get(k) ?? {};
      g[r.name] = (g[r.name] ?? 0) + 1;
      m.set(k, g);
    }
    return [...m.entries()].sort((a, b) => (b[1].free_started ?? 0) - (a[1].free_started ?? 0));
  };

  const error = eventsRes.error?.message ?? viewsRes.error?.message;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">Statistik</h1>
        <div className="flex gap-2 text-sm">
          {[7, 30, 90].map((d) => (
            <a
              key={d}
              href={`/admin/statistik?dagar=${d}`}
              className={`rounded-full border-2 px-3 py-1 font-semibold ${d === days ? "border-primary bg-primary text-white" : "border-line bg-surface"}`}
            >
              {d} dagar
            </a>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted">
        Inga personuppgifter: ingen IP-adress, inga cookies och ingen identitet. Ett besök = en öppen flik (laddas sidan om
        helt räknas ett nytt besök). Tid = tiden sidan faktiskt syntes på skärmen. Dina egna besök på de vanliga sidorna
        räknas också; adminsidorna räknas inte.
      </p>
      {error && <p className="font-semibold">Kunde inte hämta statistik: {error}</p>}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label="Besök" value={summary.visits} />
        <Card label="Sidvisningar" value={summary.pageViews} sub={summary.visits ? `${(summary.pageViews / summary.visits).toFixed(1)} sidor per besök` : undefined} />
        <Card label="Snittid per besök" value={formatDuration(summary.avgVisitMs)} sub={`Mittvärde ${formatDuration(summary.medianVisitMs)}`} />
        <Card label="Lämnade efter en sida" value={pct(summary.bounceRate)} sub="av alla besök" />
      </section>

      <section>
        <h2 className="mb-2 text-xl font-extrabold">Tratten</h2>
        <p className="mb-3 text-sm text-muted">
          Hur många som kommer vidare till varje steg. &quot;Kvar&quot; = andel av föregående steg.
        </p>
        {drop && (
          <p className="mb-3 rounded-xl border-2 border-cta bg-cta-soft p-3 text-sm font-semibold text-cta-dark">
            Största tappet: från &quot;{drop.from}&quot; till &quot;{drop.to}&quot; – bara {pct(drop.kept)} går vidare. Börja
            förbättra där.
          </p>
        )}
        <div className="space-y-2 rounded-2xl border border-line bg-surface p-4">
          {steps.map((s, i) => (
            <div key={s.label} className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-3 text-sm">
              <span className="font-semibold">{s.label}</span>
              <div className="h-6 rounded-full bg-primary-soft">
                <div className="h-6 rounded-full bg-primary" style={{ width: `${Math.min(100, Math.round((s.ofFirst ?? 0) * 100))}%` }} />
              </div>
              <span className="w-32 text-end tabular-nums">
                <strong>{s.count}</strong>
                {i > 0 && <span className="text-muted"> · kvar {pct(s.ofPrevious)}</span>}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-extrabold">Besök per dag</h2>
        <div className="space-y-1 rounded-2xl border border-line bg-surface p-4">
          {days_.map((d) => (
            <div key={d.day} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 text-sm">
              <span className="tabular-nums">{d.day}</span>
              <div className="h-4 rounded-full bg-primary-soft">
                <div className="h-4 rounded-full bg-primary" style={{ width: `${Math.round((d.visits / maxDay) * 100)}%` }} />
              </div>
              <span className="w-40 text-end tabular-nums">
                <strong>{d.visits}</strong> besök <span className="text-muted">· {d.pageViews} sidor</span>
              </span>
            </div>
          ))}
          {days_.length === 0 && <p className="text-muted">Ingen data än.</p>}
        </div>
      </section>

      <PageTable
        title="Var besökarna lämnar (utgångssidor)"
        hint={`Sidan där besöket slutade. "Lämnar här" = andel av sidans visningar som var den sista sidan i besöket.`}
        rows={exits}
        columns={[
          { label: "Besök som slutade här", value: (p) => p.exits },
          { label: "Andel av alla besök", value: (p) => pct(summary.visits ? p.exits / summary.visits : null) },
          { label: "Lämnar här", value: (p) => pct(p.views ? p.exits / p.views : null) },
        ]}
      />
      <PageTable
        title="Var besökarna kommer in (första sidan)"
        rows={entries}
        columns={[
          { label: "Besök som började här", value: (p) => p.entries },
          { label: "Andel", value: (p) => pct(summary.visits ? p.entries / summary.visits : null) },
        ]}
      />
      <PageTable
        title="Alla sidor"
        rows={pages}
        columns={[
          { label: "Visningar", value: (p) => p.views },
          { label: "Snittid på sidan", value: (p) => formatDuration(p.avgMs) },
          { label: "Lämnar här", value: (p) => pct(p.views ? p.exits / p.views : null) },
        ]}
      />

      <EventTable title="Händelser per språk" rows={group("language")} labelFor={(k) => (isLanguageCode(k) ? languages[k].swedishName : k)} />
      <EventTable title="Händelser per rabattkod" rows={group("ref_code")} labelFor={(k) => k} />
    </div>
  );
}

function Card({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-3xl font-extrabold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

type PageRowLike = ReturnType<typeof perPage>[number];

function PageTable({
  title,
  hint,
  rows,
  columns,
}: {
  title: string;
  hint?: string;
  rows: PageRowLike[];
  columns: { label: string; value: (p: PageRowLike) => string | number }[];
}) {
  return (
    <section>
      <h2 className="mb-2 text-xl font-extrabold">{title}</h2>
      {hint && <p className="mb-2 text-sm text-muted">{hint}</p>}
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-primary-soft">
            <tr>
              <th className="p-3 text-start">Sida</th>
              {columns.map((c) => (
                <th key={c.label} className="p-3 text-end">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((p) => (
              <tr key={p.path}>
                <td className="p-3">
                  <span className="font-semibold">{pageName(p.path) ?? p.path}</span>
                  {pageName(p.path) && <span className="ms-2 text-xs text-muted">{p.path}</span>}
                </td>
                {columns.map((c) => (
                  <td key={c.label} className="p-3 text-end tabular-nums">
                    {c.value(p)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="p-4 text-muted">
                  Ingen data än.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EventTable({ title, rows, labelFor }: { title: string; rows: [string, Record<string, number>][]; labelFor: (k: string) => string }) {
  return (
    <section>
      <h2 className="mb-2 text-xl font-extrabold">{title}</h2>
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-primary-soft">
            <tr>
              <th className="p-3 text-start" />
              {EVENTS.map((e) => (
                <th key={e.name} className="p-3 text-end">
                  {e.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(([k, v]) => (
              <tr key={k}>
                <td className="p-3 font-semibold">{labelFor(k)}</td>
                {EVENTS.map((e) => (
                  <td key={e.name} className="p-3 text-end">
                    {v[e.name] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={EVENTS.length + 1} className="p-4 text-muted">
                  Ingen data än.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
