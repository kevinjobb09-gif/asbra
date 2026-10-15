import { languages, isLanguageCode } from "@/config";
import { createAdminClient } from "@/lib/supabase/admin";

const EVENTS = [
  { name: "free_started", label: "Startade gratisövning" },
  { name: "free_finished", label: "Avslutade gratisövning" },
  { name: "checkout_opened", label: "Öppnade betalning" },
  { name: "paid", label: "Betalade" },
] as const;

/** Tidpunkt för N dagar sedan (räknas när sidan hämtas på servern). */
function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

type Props = { searchParams: Promise<{ dagar?: string }> };

/** Integritetsvänlig statistik: hur många som tar sig genom varje steg. */
export default async function StatsPage({ searchParams }: Props) {
  const days = [7, 30, 90].includes(Number((await searchParams).dagar)) ? Number((await searchParams).dagar) : 30;
  const since = daysAgoIso(days);
  const { data, error } = await createAdminClient()
    .from("analytics_events")
    .select("name, language, ref_code, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50_000);
  const rows = data ?? [];

  const count = (name: string) => rows.filter((r) => r.name === name).length;
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : "–");

  // Per dag (svensk tid)
  const dayKey = (iso: string) =>
    new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
  const perDay = new Map<string, Record<string, number>>();
  for (const r of rows) {
    const d = perDay.get(dayKey(r.created_at)) ?? {};
    d[r.name] = (d[r.name] ?? 0) + 1;
    perDay.set(dayKey(r.created_at), d);
  }

  // Per språk och per kod
  const group = (key: "language" | "ref_code") => {
    const m = new Map<string, Record<string, number>>();
    for (const r of rows) {
      const k = r[key] ?? "–";
      const g = m.get(k) ?? {};
      g[r.name] = (g[r.name] ?? 0) + 1;
      m.set(k, g);
    }
    return [...m.entries()].sort((a, b) => (b[1].free_started ?? 0) - (a[1].free_started ?? 0));
  };

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
      <p className="text-sm text-muted">Ingen data om enskilda personer sparas – bara händelse, språk och ev. rabattkod.</p>
      {error && <p className="text-wrong">Kunde inte hämta statistik: {error.message}</p>}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {EVENTS.map((e, i) => (
          <div key={e.name} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">{e.label}</p>
            <p className="text-3xl font-extrabold">{count(e.name)}</p>
            {i > 0 && <p className="text-xs text-muted">{pct(count(e.name), count(EVENTS[i - 1].name))} av föregående steg</p>}
          </div>
        ))}
      </section>

      <Table title="Per språk" rows={group("language")} labelFor={(k) => (isLanguageCode(k) ? languages[k].swedishName : k)} />
      <Table title="Per rabattkod" rows={group("ref_code")} labelFor={(k) => k} />
      <Table
        title="Per dag"
        rows={[...perDay.entries()].sort((a, b) => b[0].localeCompare(a[0]))}
        labelFor={(k) => k}
      />
    </div>
  );
}

function Table({ title, rows, labelFor }: { title: string; rows: [string, Record<string, number>][]; labelFor: (k: string) => string }) {
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
                <td colSpan={5} className="p-4 text-muted">
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
