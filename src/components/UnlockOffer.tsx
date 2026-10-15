import { Check, Lock } from "lucide-react";
import { formatPrice, getCountry, languages } from "@/config";
import { ButtonLink } from "./ButtonLink";

type Props = {
  /** Rubriken ovanför erbjudandet, t.ex. resultatet från gratisläget. */
  title?: string;
  intro?: string;
  /** Visa länken "Prova gratis först" (när man inte har provat än). */
  showFreeLink?: boolean;
};

/** Erbjudandet att låsa upp allt. Visas efter gratisläget och på låsta sidor. */
export function UnlockOffer({ title = "Lås upp allt och bli redo för provet", intro, showFreeLink }: Props) {
  const country = getCountry();
  const { exam, pricing, chapters } = country;
  const otherLanguages = country.explanationLanguages.filter((c) => c !== country.examLanguage);

  // <bdi> håller varje språknamn i sin egen skrivriktning, så att arabiska och persiska inte blandas ihop.
  const languageList = otherLanguages.map((c, i) => (
    <span key={c}>
      <bdi lang={languages[c].htmlLang}>{languages[c].nativeName}</bdi>
      {i < otherLanguages.length - 1 ? ", " : ""}
    </span>
  ));

  const benefits: { key: string; content: React.ReactNode }[] = [
    { key: "kapitel", content: `Alla frågor i alla ${chapters.length} kapitel` },
    { key: "prov", content: `Provsimulering: ${exam.questionCount} frågor på ${exam.durationMinutes} minuter` },
    { key: "repetera", content: "Repetera frågorna du svarat fel på" },
    { key: "framsteg", content: "Se vilka kapitel du behöver plugga mer på" },
    { key: "sprak", content: <>Förklaringar på ditt språk: {languageList}</> },
  ];

  return (
    <section className="overflow-hidden rounded-3xl border-2 border-primary bg-surface shadow-lg shadow-primary/10">
      <div className="bg-primary px-5 py-6 text-center text-white">
        <Lock className="mx-auto mb-2 opacity-80" aria-hidden />
        <h2 className="text-2xl font-extrabold text-balance">{title}</h2>
        {intro && <p className="mt-2 text-white/85">{intro}</p>}
      </div>
      <div className="space-y-5 p-5">
        <ul className="space-y-2">
          {benefits.map((b) => (
            <li key={b.key} className="flex items-start gap-2">
              <Check className="mt-0.5 shrink-0 text-primary" size={20} strokeWidth={3} aria-hidden />
              <span>{b.content}</span>
            </li>
          ))}
        </ul>
        <div className="text-center">
          <p className="text-4xl font-extrabold">{formatPrice(country)}</p>
          <p className="text-sm text-muted">
            Betala en gång. Tillgång i {pricing.accessMonths} månader. Ingen prenumeration.
          </p>
        </div>
        <ButtonLink href="/kop" size="lg" className="w-full">
          Lås upp allt – {formatPrice(country)}
        </ButtonLink>
        {showFreeLink && (
          <ButtonLink href="/ova/gratis" variant="outline" className="w-full">
            Prova gratis först
          </ButtonLink>
        )}
      </div>
    </section>
  );
}
