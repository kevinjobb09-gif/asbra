import { languages, isLanguageCode } from "@/config";
import { deleteTranslation, saveTranslation } from "@/app/admin/(skyddad)/actions";

type Translation = { language: string; explanation: string; status: "machine" | "reviewed" };

/**
 * Översättningar av förklaringen. Maskinöversättningar märks i appen tills de
 * har granskats här. Om den svenska förklaringen ändras tas översättningarna
 * bort automatiskt och skapas på nytt med  npm run oversatt-forklaringar.
 */
export function TranslationsEditor({ questionId, translations }: { questionId: string; translations: Translation[] }) {
  const reviewed = translations.filter((t) => t.status === "reviewed").length;
  return (
    <details className="rounded-2xl border border-line bg-surface p-4">
      <summary className="cursor-pointer font-bold">
        Översättningar av förklaringen ({translations.length} st, {reviewed} granskade)
      </summary>
      {translations.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Inga översättningar än. Markera frågan som granskad och kör <code>npm.cmd run oversatt-forklaringar</code>.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {translations
            .sort((a, b) => a.language.localeCompare(b.language))
            .map((t) => {
              const lang = isLanguageCode(t.language) ? languages[t.language] : null;
              return (
                <li key={t.language} className="space-y-2 border-t border-line pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <strong>{lang?.swedishName ?? t.language}</strong>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${t.status === "reviewed" ? "bg-primary text-white" : "bg-cta-soft text-cta-dark"}`}
                    >
                      {t.status === "reviewed" ? "Granskad" : "Maskinöversatt"}
                    </span>
                  </div>
                  <form action={saveTranslation} className="space-y-2">
                    <input type="hidden" name="question_id" value={questionId} />
                    <input type="hidden" name="language" value={t.language} />
                    <textarea
                      name="explanation"
                      defaultValue={t.explanation}
                      rows={3}
                      lang={lang?.htmlLang}
                      dir={lang?.dir}
                      className="w-full rounded-xl border-2 border-line px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white">Spara som granskad</button>
                      <button
                        formAction={deleteTranslation}
                        className="rounded-full border-2 border-line px-4 py-1.5 text-sm font-semibold"
                      >
                        Ta bort
                      </button>
                    </div>
                  </form>
                </li>
              );
            })}
        </ul>
      )}
    </details>
  );
}
