import Link from "next/link";
import { getCountry } from "@/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Question } from "@/lib/questions/schema";
import { approveQuestion, rejectQuestion } from "../actions";

type Props = { searchParams: Promise<{ nr?: string; kapitel?: string }> };

const LETTERS = "ABCD";

/**
 * Snabbgranskning: ett utkast i taget med rätt svar markerat. Gratisfrågorna
 * kommer först så att gratisläget blir klart snabbt. Fungerar bra på mobilen.
 */
export default async function ReviewPage({ searchParams }: Props) {
  const params = await searchParams;
  const country = getCountry();
  const chapter = Number(params.kapitel) || undefined;
  const nr = Math.max(0, Number(params.nr) || 0);

  let query = createAdminClient()
    .from("questions")
    .select("*", { count: "exact" })
    .eq("country", country.code)
    .eq("status", "draft")
    .order("is_free", { ascending: false })
    .order("chapter")
    .order("created_at")
    .order("id")
    .range(nr, nr);
  if (chapter) query = query.eq("chapter", chapter);
  const { data, count, error } = await query;
  const question = (data?.[0] ?? null) as Question | null;
  const total = count ?? 0;

  const base = `/admin/granska?${chapter ? `kapitel=${chapter}&` : ""}`;
  const here = `${base}nr=${nr}`; // Efter godkänn/ta bort hamnar nästa fråga på samma plats.

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="me-auto text-2xl font-extrabold">Granska utkast</h1>
        <span className="text-sm text-muted">{total} utkast kvar{chapter ? ` i kapitel ${chapter}` : ""}</span>
      </div>

      <div className="flex flex-wrap gap-1 text-xs">
        <Link href="/admin/granska" className={`rounded-full border-2 px-2 py-1 font-semibold ${!chapter ? "border-primary bg-primary text-white" : "border-line bg-surface"}`}>
          Alla
        </Link>
        {country.chapters.map((ch) => (
          <Link
            key={ch.number}
            href={`/admin/granska?kapitel=${ch.number}`}
            className={`rounded-full border-2 px-2 py-1 font-semibold ${chapter === ch.number ? "border-primary bg-primary text-white" : "border-line bg-surface"}`}
          >
            {ch.number}
          </Link>
        ))}
      </div>

      {error && <p className="text-wrong">Kunde inte hämta utkast: {error.message}</p>}

      {!question ? (
        <div className="rounded-2xl border border-line bg-surface p-6 text-center">
          <p className="font-bold">{total ? "Du har gått igenom alla utkast i listan." : "Inga utkast kvar att granska. Bra jobbat!"}</p>
          {total > 0 && (
            <Link href={base} className="mt-3 inline-block font-semibold text-primary">Börja om från första överhoppade →</Link>
          )}
        </div>
      ) : (
        <article className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>Utkast {nr + 1} av {total}</span>
            <span>·</span>
            <span>Kap {question.chapter} {country.chapters.find((c) => c.number === question.chapter)?.title}</span>
            {question.is_free && <span className="rounded-full bg-primary-soft px-2 py-0.5 font-semibold text-primary">Gratisfråga</span>}
            <span className="rounded-full bg-line px-2 py-0.5">Svårighet {question.difficulty}</span>
          </div>

          <h2 lang="sv" className="text-lg font-bold">{question.question}</h2>

          <ol className="space-y-2">
            {question.options.map((option, i) => {
              const correct = i === question.correct_index;
              return (
                <li
                  key={i}
                  lang="sv"
                  className={`flex gap-3 rounded-xl border-2 p-3 ${correct ? "border-correct-line bg-correct-bg font-semibold text-correct" : "border-line"}`}
                >
                  <span className="font-bold">{LETTERS[i]}</span>
                  <span>{option}</span>
                  {correct && <span className="ms-auto text-xs">Rätt svar</span>}
                </li>
              );
            })}
          </ol>

          <div className="rounded-xl bg-bg p-3 text-sm">
            <p className="font-semibold">Förklaring</p>
            <p lang="sv">{question.explanation}</p>
          </div>

          <p className="text-sm">
            <span className="font-semibold">Källa: </span>
            {question.source_reference}
          </p>

          {question.review_note && (
            <p className="rounded-xl bg-cta-soft p-3 text-sm text-cta-dark">⚠️ {question.review_note}</p>
          )}

          <p className="text-xs text-muted">
            Kontrollera mot sidan i Sverige i fokus att frågan och det rätta svaret stämmer och att de felaktiga
            alternativen verkligen är fel. Är något fel – tryck Redigera.
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <form action={approveQuestion} className="col-span-2 sm:col-span-1">
              <input type="hidden" name="id" value={question.id} />
              <input type="hidden" name="next" value={here} />
              <button className="w-full rounded-full bg-primary px-4 py-3 font-bold text-white hover:bg-primary-dark">
                Godkänn
              </button>
            </form>
            <Link
              href={`${base}nr=${nr + 1}`}
              className="rounded-full border-2 border-line px-4 py-3 text-center font-semibold hover:border-primary"
            >
              Hoppa över
            </Link>
            <Link
              href={`/admin/fragor/${question.id}`}
              className="rounded-full border-2 border-line px-4 py-3 text-center font-semibold hover:border-primary"
            >
              Redigera
            </Link>
            <form action={rejectQuestion} className="col-span-2 sm:col-span-1">
              <input type="hidden" name="id" value={question.id} />
              <input type="hidden" name="next" value={here} />
              <button className="w-full rounded-full border-2 border-line px-4 py-3 font-semibold hover:border-cta">
                Ta bort
              </button>
            </form>
          </div>
        </article>
      )}
    </div>
  );
}
