import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { setReportResolved } from "../actions";

type Props = { searchParams: Promise<{ visa?: string }> };

type ReportRow = {
  id: string;
  message: string | null;
  created_at: string;
  resolved_at: string | null;
  question: { id: string; question: string; chapter: number } | null;
};

export default async function ReportsPage({ searchParams }: Props) {
  const { visa } = await searchParams;
  const showResolved = visa === "alla";

  let query = createAdminClient()
    .from("question_reports")
    .select("id, message, created_at, resolved_at, question:questions(id, question, chapter)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (!showResolved) query = query.is("resolved_at", null);
  const { data, error } = await query;
  const reports = (data ?? []) as unknown as ReportRow[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">Felrapporter</h1>
        <Link href={showResolved ? "/admin/rapporter" : "/admin/rapporter?visa=alla"} className="text-sm font-semibold text-primary">
          {showResolved ? "Visa bara öppna" : "Visa även lösta"}
        </Link>
      </div>
      {error && <p className="text-wrong">Kunde inte hämta rapporter: {error.message}</p>}

      <ul className="space-y-2">
        {reports.length === 0 && <li className="rounded-2xl border border-line bg-surface p-4 text-muted">Inga rapporter. 🎉</li>}
        {reports.map((r) => (
          <li key={r.id} className="rounded-2xl border border-line bg-surface p-4">
            <div className="text-xs text-muted">
              {new Date(r.created_at).toLocaleString("sv-SE")}
              {r.question && ` · Kap ${r.question.chapter}`}
              {r.resolved_at && " · Löst"}
            </div>
            {r.question ? (
              <Link href={`/admin/fragor/${r.question.id}`} className="mt-1 block font-semibold text-primary">
                {r.question.question}
              </Link>
            ) : (
              <p className="mt-1 text-muted">(Frågan är borttagen)</p>
            )}
            <p className="mt-2">{r.message || <span className="text-muted">(ingen kommentar)</span>}</p>
            <form action={setReportResolved} className="mt-3">
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="resolved" value={r.resolved_at ? "false" : "true"} />
              <button className="rounded-full border-2 border-line px-4 py-1.5 text-sm font-semibold">
                {r.resolved_at ? "Öppna igen" : "Markera som löst"}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
