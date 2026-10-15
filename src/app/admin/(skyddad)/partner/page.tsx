import { createAdminClient } from "@/lib/supabase/admin";
import { CodeForm } from "./CodeForm";
import { toggleCode } from "./actions";

const kr = (minor: number) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(minor / 100);

type Code = {
  code: string;
  partner_name: string;
  discount_percent: number;
  commission_percent: number;
  active: boolean;
  note: string | null;
};

/** Rabatt- och partnerkoder med försäljning och provision per kod. */
export default async function PartnerPage() {
  const db = createAdminClient();
  const [{ data: codes }, { data: sales }] = await Promise.all([
    db.from("partner_codes").select("*").order("created_at", { ascending: false }),
    db.from("purchases").select("ref_code, amount_minor, commission_minor, paid_at").eq("status", "paid"),
  ]);

  const byCode = new Map<string, { count: number; revenue: number; commission: number }>();
  let total = { count: 0, revenue: 0 };
  for (const s of sales ?? []) {
    total = { count: total.count + 1, revenue: total.revenue + s.amount_minor };
    if (!s.ref_code) continue;
    const c = byCode.get(s.ref_code) ?? { count: 0, revenue: 0, commission: 0 };
    c.count++;
    c.revenue += s.amount_minor;
    c.commission += s.commission_minor;
    byCode.set(s.ref_code, c);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Rabatt- och partnerkoder</h1>
      <p className="text-sm text-muted">
        Dela länken <code>https://DIN-DOMÄN/?ref=KOD</code> (eller t.ex. <code>/ar?ref=KOD</code>). Koden sparas i 30 dagar
        hos besökaren. Köparen får rabatten och köpet registreras på koden.
      </p>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Box label="Betalda köp totalt" value={String(total.count)} />
        <Box label="Intäkt totalt (inkl. moms)" value={kr(total.revenue)} />
        <Box label="Provision att betala ut" value={kr([...byCode.values()].reduce((s, c) => s + c.commission, 0))} />
      </section>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-primary-soft text-start">
            <tr>
              <th className="p-3 text-start">Kod</th>
              <th className="p-3 text-start">Partner</th>
              <th className="p-3 text-end">Rabatt</th>
              <th className="p-3 text-end">Provision</th>
              <th className="p-3 text-end">Köp</th>
              <th className="p-3 text-end">Intäkt</th>
              <th className="p-3 text-end">Att betala</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {((codes ?? []) as Code[]).map((c) => {
              const s = byCode.get(c.code) ?? { count: 0, revenue: 0, commission: 0 };
              return (
                <tr key={c.code} className={c.active ? "" : "opacity-50"}>
                  <td className="p-3 font-mono font-bold">{c.code}</td>
                  <td className="p-3">
                    {c.partner_name}
                    {c.note && <span className="block text-xs text-muted">{c.note}</span>}
                  </td>
                  <td className="p-3 text-end">{c.discount_percent} %</td>
                  <td className="p-3 text-end">{c.commission_percent} %</td>
                  <td className="p-3 text-end">{s.count}</td>
                  <td className="p-3 text-end">{kr(s.revenue)}</td>
                  <td className="p-3 text-end font-bold">{kr(s.commission)}</td>
                  <td className="p-3 text-end">
                    <form action={toggleCode}>
                      <input type="hidden" name="code" value={c.code} />
                      <input type="hidden" name="active" value={c.active ? "false" : "true"} />
                      <button className="rounded-full border-2 border-line px-3 py-1 text-xs font-semibold">
                        {c.active ? "Stäng av" : "Slå på"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {!codes?.length && (
              <tr>
                <td colSpan={8} className="p-4 text-muted">
                  Inga koder än.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-extrabold">Ny kod / ändra kod</h2>
        <CodeForm />
      </section>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-2xl font-extrabold">{value}</p>
    </div>
  );
}
