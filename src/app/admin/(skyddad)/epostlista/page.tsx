import { languages, type LanguageCode } from "@/config";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { unsubscribe } from "./actions";

export const dynamic = "force-dynamic";

const day = (iso: string) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(iso),
  );

const languageName = (code: string | null) => (code && code in languages ? languages[code as LanguageCode].swedishName : code ?? "–");

/** E-postlistan: vilka som får erbjudanden, och hur många som skrev e-post före gratisfrågorna. */
export default async function MailingListPage() {
  // Sidan visar personuppgifter – kontrollera även här, inte bara i layouten.
  await requireAdmin();
  const db = createAdminClient();
  const [{ data: list }, { count: freeCount }] = await Promise.all([
    db.from("email_signups").select("email, language, marketing_consent_at, used_at").order("marketing_consent_at", { ascending: false }),
    db.from("free_signups").select("email", { count: "exact", head: true }),
  ]);
  const rows = list ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">E-postlista</h1>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Box label="Får erbjudanden (har samtyckt)" value={String(rows.length)} />
        <Box label="Skrev e-post före gratisfrågorna" value={String(freeCount ?? 0)} />
      </section>

      <div className="space-y-2 rounded-2xl border-2 border-cta bg-cta-soft p-4 text-sm text-cta-dark">
        <p className="font-bold">Skicka bara erbjudanden till adresserna i listan nedan.</p>
        <p>
          De har själva kryssat i rutan för tips och erbjudanden. Adresser som bara skrevs före gratisfrågorna (utan kryss) får
          du inte skicka reklam till – de syns därför inte här och raderas automatiskt efter 12 månader.
        </p>
        <p>
          Varje utskick ska tala om att det kommer från Medborgarhjälpen och hur man avregistrerar sig. Ber någon om det: tryck
          på <strong>Avregistrera</strong> vid adressen.
        </p>
      </div>

      {/* Vanlig länk (inte <Link>): det är en filnedladdning från en route handler, ingen sida. */}
      <a
        href="/admin/epostlista/csv"
        download
        className="inline-flex rounded-full bg-primary px-5 py-3 font-bold text-white hover:bg-primary-dark"
      >
        Ladda ner listan (CSV)
      </a>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-primary-soft">
            <tr>
              <th className="p-3">E-post</th>
              <th className="p-3">Språk</th>
              <th className="p-3">Samtycke</th>
              <th className="p-3">Rabattkod</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-3 text-muted">
                  Ingen har skrivit upp sig än.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.email}>
                <td className="p-3" dir="ltr">
                  {r.email}
                </td>
                <td className="p-3">{languageName(r.language)}</td>
                <td className="p-3">{day(r.marketing_consent_at)}</td>
                <td className="p-3">{r.used_at ? `Använd ${day(r.used_at)}` : "Inte använd"}</td>
                <td className="p-3 text-right">
                  <form action={unsubscribe}>
                    <input type="hidden" name="email" value={r.email} />
                    <button className="rounded-full border-2 border-line px-3 py-1 font-semibold hover:border-primary">
                      Avregistrera
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}
