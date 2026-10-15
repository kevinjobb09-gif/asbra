import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, ChevronRight, Clock, Lock, RotateCcw } from "lucide-react";
import { getCountry } from "@/config";
import { getReviewedCountsByChapter } from "@/lib/questions/public";
import { getAccess } from "@/lib/access";
import { getI18n } from "@/i18n/server";
import { ButtonLink } from "@/components/ButtonLink";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("practiceIndex.title"), description: t("practiceIndex.intro") };
}

// Hämtas på nytt vid varje besök så att nygranskade frågor syns direkt.
export const dynamic = "force-dynamic";

export default async function PracticeIndexPage() {
  const country = getCountry();
  const [counts, access, { t }] = await Promise.all([getReviewedCountsByChapter(country.code), getAccess(), getI18n()]);
  const locked = !access.hasFullAccess;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">{t("practiceIndex.title")}</h1>
      <p className="mt-2 text-muted">{t("practiceIndex.intro")}</p>

      {locked && (
        <div className="mt-6 rounded-2xl border-2 border-cta bg-cta-soft p-4">
          <p className="font-bold">{t("practiceIndex.freeBannerTitle", { n: country.freeQuestionLimit })}</p>
          <p className="mt-1 text-sm">{t("practiceIndex.freeBannerText")}</p>
          <ButtonLink href="/ova/gratis" className="mt-3 w-full sm:w-auto">
            {t("practiceIndex.freeBannerCta")}
          </ButtonLink>
        </div>
      )}

      <Link
        href="/prov"
        className="mt-6 flex items-center gap-3 rounded-2xl border-2 border-primary bg-primary-soft p-4 transition-colors hover:bg-primary hover:text-white"
      >
        <Clock className="shrink-0" aria-hidden />
        <span className="flex-1">
          <span className="block font-bold">{t("practiceIndex.examCardTitle")}</span>
          <span className="text-sm">
            {t("practiceIndex.examCardText", { q: country.exam.questionCount, m: country.exam.durationMinutes })}
          </span>
        </span>
        {locked ? (
          <Lock size={18} aria-label={t("practiceIndex.locked")} />
        ) : (
          <ChevronRight className="rtl:rotate-180" aria-hidden />
        )}
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link
          href="/repetera"
          className="flex items-center gap-2 rounded-2xl border-2 border-line bg-surface p-3 font-bold transition-colors hover:border-primary"
        >
          <RotateCcw size={20} className="shrink-0 text-primary" aria-hidden />
          <span className="flex-1">{t("practiceIndex.reviewCard")}</span>
          {locked && <Lock size={16} className="text-muted" aria-label={t("practiceIndex.locked")} />}
        </Link>
        <Link
          href="/resultat"
          className="flex items-center gap-2 rounded-2xl border-2 border-line bg-surface p-3 font-bold transition-colors hover:border-primary"
        >
          <BarChart3 size={20} className="shrink-0 text-primary" aria-hidden />
          <span className="flex-1">{t("practiceIndex.resultsCard")}</span>
        </Link>
      </div>

      <h2 className="mt-8 text-xl font-extrabold">{t("practiceIndex.chaptersHeading")}</h2>
      <ul className="mt-3 space-y-2">
        {country.chapters.map((ch) => {
          const count = counts.get(ch.number) ?? 0;
          const content = (
            <>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft font-extrabold text-primary">
                {ch.number}
              </span>
              <span className="flex-1">
                <span className="block font-bold" lang="sv">
                  {ch.title}
                </span>
                <span className="text-sm text-muted">
                  {count > 0 ? t("practiceIndex.questionCount", { n: count }) : t("practiceIndex.comingSoon")}
                </span>
              </span>
              {count > 0 &&
                (locked ? (
                  <Lock size={18} className="text-muted" aria-label={t("practiceIndex.locked")} />
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
