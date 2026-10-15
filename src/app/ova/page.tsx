import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Clock, Lock } from "lucide-react";
import { getCountry } from "@/config";
import { getReviewedCountsByChapter } from "@/lib/questions/public";
import { getAccess } from "@/lib/access";
import { ButtonLink } from "@/components/ButtonLink";

export const metadata: Metadata = {
  title: "Öva per kapitel",
  description: "Välj ett kapitel och öva en fråga i taget med förklaring och källa.",
};

// Hämtas på nytt vid varje besök så att nygranskade frågor syns direkt.
export const dynamic = "force-dynamic";

export default async function PracticeIndexPage() {
  const country = getCountry();
  const [counts, access] = await Promise.all([getReviewedCountsByChapter(country.code), getAccess()]);
  const locked = !access.hasFullAccess;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Öva per kapitel</h1>
      <p className="mt-2 text-muted">
        Välj ett kapitel. Du får en fråga i taget och ser direkt om du svarat rätt.
      </p>

      {locked && (
        <div className="mt-6 rounded-2xl border-2 border-cta bg-cta-soft p-4">
          <p className="font-bold">Börja med {country.freeQuestionLimit} gratisfrågor</p>
          <p className="mt-1 text-sm">Frågor från alla kapitel. Inget konto behövs.</p>
          <ButtonLink href="/ova/gratis" className="mt-3 w-full sm:w-auto">
            Öva gratis nu
          </ButtonLink>
        </div>
      )}

      <Link
        href="/prov"
        className="mt-6 flex items-center gap-3 rounded-2xl border-2 border-primary bg-primary-soft p-4 transition-colors hover:bg-primary hover:text-white"
      >
        <Clock className="shrink-0" aria-hidden />
        <span className="flex-1">
          <span className="block font-bold">Provsimulering</span>
          <span className="text-sm">
            {country.exam.questionCount} frågor på {country.exam.durationMinutes} minuter, som på riktigt
          </span>
        </span>
        {locked ? <Lock size={18} aria-label="Låst" /> : <ChevronRight className="rtl:rotate-180" aria-hidden />}
      </Link>

      <h2 className="mt-8 text-xl font-extrabold">Kapitel</h2>
      <ul className="mt-3 space-y-2">
        {country.chapters.map((ch) => {
          const count = counts.get(ch.number) ?? 0;
          const content = (
            <>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft font-extrabold text-primary">
                {ch.number}
              </span>
              <span className="flex-1">
                <span className="block font-bold">{ch.title}</span>
                <span className="text-sm text-muted">{count > 0 ? `${count} frågor` : "Frågor kommer snart"}</span>
              </span>
              {count > 0 &&
                (locked ? (
                  <Lock size={18} className="text-muted" aria-label="Låst" />
                ) : (
                  <ChevronRight className="text-muted rtl:rotate-180" aria-hidden />
                ))}
            </>
          );
          return (
            <li key={ch.number}>
              {count > 0 ? (
                <Link
                  href={`/ova/kapitel/${ch.number}`}
                  className="flex items-center gap-3 rounded-2xl border-2 border-line bg-surface p-3 transition-colors hover:border-primary"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border-2 border-line bg-surface p-3 opacity-60">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
