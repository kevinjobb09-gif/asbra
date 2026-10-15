"use client";

import { useActionState, useState } from "react";
import { getCountry } from "@/config";
import { AnswerOption } from "@/components/AnswerOption";
import { saveQuestion, type SaveState } from "@/app/admin/(skyddad)/actions";
import type { Question } from "@/lib/questions/schema";

type Props = { question?: Question; savedNotice?: boolean };

const inputClass = "mt-1 w-full rounded-xl border-2 border-line bg-surface px-3 py-2";

/**
 * Formulär för att skapa och granska en fråga. Till höger (under, på mobil)
 * visas källhänvisningen och hur frågan ser ut för användaren.
 */
export function QuestionForm({ question, savedNotice }: Props) {
  const country = getCountry(question?.country);
  const [state, action, pending] = useActionState<SaveState, FormData>(saveQuestion, {
    ok: !!savedNotice,
    message: savedNotice ? "Frågan är sparad." : undefined,
  });

  // Lokalt tillstånd för förhandsvisningen.
  const [draft, setDraft] = useState({
    question: question?.question ?? "",
    options: question?.options ?? ["", "", "", ""],
    correct: question?.correct_index ?? 0,
    explanation: question?.explanation ?? "",
    source: question?.source_reference ?? "",
  });
  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <input type="hidden" name="id" value={question?.id ?? ""} />
      <input type="hidden" name="country" value={country.code} />

      <div className="space-y-4">
        {state.message && (
          <p className={`rounded-xl p-3 ${state.ok ? "bg-primary-soft" : "bg-wrong-bg text-wrong"}`}>{state.message}</p>
        )}

        {question?.review_note && (
          <div className="rounded-xl border-2 border-cta bg-cta-soft p-3 text-sm">
            <strong>Notering:</strong> {question.review_note}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm font-semibold">Kapitel</span>
            <select name="chapter" defaultValue={question?.chapter ?? 1} className={inputClass}>
              {country.chapters.map((c) => (
                <option key={c.number} value={c.number}>
                  {c.number}. {c.title}
                </option>
              ))}
            </select>
            <FieldError msg={err.chapter} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Avsnitt</span>
            <input name="section" defaultValue={question?.section} placeholder="t.ex. 3.2 Riksdagen" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Svårighet</span>
            <select name="difficulty" defaultValue={question?.difficulty ?? 2} className={inputClass}>
              <option value={1}>1 – Lätt</option>
              <option value={2}>2 – Medel</option>
              <option value={3}>3 – Svår</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold">Fråga (på svenska)</span>
          <textarea
            name="question"
            rows={2}
            defaultValue={question?.question}
            onChange={(e) => setDraft({ ...draft, question: e.target.value })}
            className={inputClass}
          />
          <FieldError msg={err.question} />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Svarsalternativ – markera det rätta</legend>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct_index"
                value={i}
                defaultChecked={(question?.correct_index ?? 0) === i}
                onChange={() => setDraft({ ...draft, correct: i })}
                aria-label={`Alternativ ${"ABCD"[i]} är rätt`}
                className="size-5 accent-primary"
              />
              <input
                name={`option${i}`}
                defaultValue={question?.options[i]}
                placeholder={`Alternativ ${"ABCD"[i]}`}
                onChange={(e) => {
                  const options = [...draft.options];
                  options[i] = e.target.value;
                  setDraft({ ...draft, options });
                }}
                className={`${inputClass} mt-0`}
              />
            </div>
          ))}
          <FieldError msg={err.options ?? err.correct_index} />
        </fieldset>

        <label className="block">
          <span className="text-sm font-semibold">Förklaring (på svenska, enkelt språk)</span>
          <textarea
            name="explanation"
            rows={4}
            defaultValue={question?.explanation}
            onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
            className={inputClass}
          />
          <FieldError msg={err.explanation} />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Källhänvisning</span>
          <input
            name="source_reference"
            defaultValue={question?.source_reference}
            placeholder={`${country.studyMaterial.title}, kapitel 3, avsnitt 3.2`}
            onChange={(e) => setDraft({ ...draft, source: e.target.value })}
            className={inputClass}
          />
          <FieldError msg={err.source_reference} />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Intern notering (visas inte för användare)</span>
          <textarea name="review_note" rows={2} defaultValue={question?.review_note ?? ""} className={inputClass} />
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            name="intent"
            value="draft"
            disabled={pending}
            className="rounded-full border-2 border-line bg-surface px-5 py-3 font-bold disabled:opacity-60"
          >
            Spara som utkast
          </button>
          <button
            name="intent"
            value="reviewed"
            disabled={pending}
            className="rounded-full bg-primary px-5 py-3 font-bold text-white disabled:opacity-60"
          >
            Spara och markera som granskad
          </button>
        </div>
        <p className="text-xs text-muted">
          Markera bara som granskad när du har jämfört fakta med {country.studyMaterial.title} och skrivit
          frågan med egna ord.
        </p>
      </div>

      {/* Granskningsvy: källa + förhandsvisning */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border-2 border-primary bg-primary-soft p-4">
          <p className="text-xs font-bold tracking-wide text-primary uppercase">Kontrollera mot källan</p>
          <p className="mt-1 font-semibold">{draft.source || "Ingen källhänvisning ännu"}</p>
          <p className="mt-2 text-xs text-muted">
            Öppna {country.studyMaterial.title} på detta ställe och kontrollera att rätt svar och förklaringen
            stämmer.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs font-bold tracking-wide text-muted uppercase">Så ser användaren frågan</p>
          <p className="mt-2 font-semibold">{draft.question || "…"}</p>
          <div className="mt-3 space-y-2">
            {draft.options.map((o, i) => (
              <AnswerOption key={i} index={i} text={o || "…"} state={i === draft.correct ? "correct" : "dimmed"} disabled />
            ))}
          </div>
          <p className="mt-3 rounded-xl bg-primary-soft p-3 text-sm">{draft.explanation || "Förklaring …"}</p>
        </div>
      </aside>
    </form>
  );
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? <span className="mt-1 block text-sm text-wrong">{msg}</span> : null;
}
