import Link from "next/link";
import { getCountry } from "@/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Question, QuestionStatus } from "@/lib/questions/schema";
import { StatusBadge } from "@/components/admin/StatusBadge";

type Props = { searchParams: Promise<{ status?: string; kapitel?: string; borttagen?: string }> };

export default async function AdminQuestionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const country = getCountry();
  const status = params.status === "draft" || params.status === "reviewed" ? params.status : undefined;
  const chapter = Number(params.kapitel) || undefined;

  const supabase = createAdminClient();
  let query = supabase
    .from("questions")
    .select("id, chapter, section, question, status, is_sample, review_note, updated_at")
    .eq("country", country.code)
    .order("chapter")
    .order("updated_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (chapter) query = query.eq("chapter", chapter);
  const { data, error } = await query;

  // Antal per kapitel och status, för översikten.
  const { data: all } = await supabase.from("questions").select("chapter, status").eq("country", country.code);
  const counts = new Map<number, { draft: number; reviewed: number }>();
  for (const row of all ?? []) {
    const c = counts.get(row.chapter) ?? { draft: 0, reviewed: 0 };
    c[row.status as QuestionStatus]++;
    counts.set(row.chapter, c);
  }

  const questions = (data ?? []) as Pick<
    Question,
    "id" | "chapter" | "section" | "question" | "status" | "is_sample" | "review_note" | "updated_at"
  >[];

  return (
    <div className="space-y-6">
      {params.borttagen && <p className="rounded-xl bg-primary-soft p-3">Frågan är borttagen.</p>}

      <section>
        <h1 className="text-2xl font-extrabold">Frågor</h1>
        <p className="text-sm text-muted">
          Bara granskade frågor visas för användarna. Klicka på ett kapitel för att filtrera.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-7">
          {country.chapters.map((ch) => {
            const c = counts.get(ch.number) ?? { draft: 0, reviewed: 0 };
            return (
              <Link
                key={ch.number}
                href={`/admin?kapitel=${ch.number}${status ? `&status=${status}` : ""}`}
                className={`rounded-xl border-2 p-2 text-sm ${chapter === ch.number ? "border-primary bg-primary-soft" : "border-line bg-surface"}`}
              >
                <div className="font-bold">Kap {ch.number}</div>
                <div className="text-xs text-muted">
                  {c.reviewed} granskade · {c.draft} utkast
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap gap-2 text-sm">
        <FilterLink href={`/admin${chapter ? `?kapitel=${chapter}` : ""}`} active={!status}>Alla</FilterLink>
        <FilterLink href={`/admin?status=draft${chapter ? `&kapitel=${chapter}` : ""}`} active={status === "draft"}>
          Utkast
        </FilterLink>
        <FilterLink href={`/admin?status=reviewed${chapter ? `&kapitel=${chapter}` : ""}`} active={status === "reviewed"}>
          Granskade
        </FilterLink>
      </div>

      {error && <p className="text-wrong">Kunde inte hämta frågor: {error.message}</p>}

      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {questions.length === 0 && <li className="p-4 text-muted">Inga frågor här ännu.</li>}
        {questions.map((q) => (
          <li key={q.id}>
            <Link href={`/admin/fragor/${q.id}`} className="flex flex-col gap-1 p-4 hover:bg-primary-soft/50">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusBadge status={q.status} />
                {q.is_sample && <span className="rounded-full bg-cta-soft px-2 py-0.5 font-semibold text-cta-dark">Exempelfråga</span>}
                {q.review_note && <span className="rounded-full bg-cta-soft px-2 py-0.5 text-cta-dark">⚠️ Notering</span>}
                <span className="text-muted">
                  Kap {q.chapter}
                  {q.section && ` · ${q.section}`}
                </span>
              </div>
              <span className="font-medium">{q.question}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full border-2 px-3 py-1 font-semibold ${active ? "border-primary bg-primary text-white" : "border-line bg-surface"}`}
    >
      {children}
    </Link>
  );
}

