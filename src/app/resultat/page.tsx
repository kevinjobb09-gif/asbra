import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Flame, RotateCcw, Target, Trophy } from "lucide-react";
import { getCountry, languages } from "@/config";
import { getAccess } from "@/lib/access";
import { getI18n } from "@/i18n/server";
import { getMyProgress } from "@/lib/progress/load";
import { formatClock } from "@/lib/exam/timer";
import { ButtonLink } from "@/components/ButtonLink";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("results.title"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

const percent = (share: number | null) => (share === null ? "–" : `${Math.round(share * 100)} %`);

export default async function ResultsPage() {
  const country = getCountry();
  const [progress, access, { t, lang }] = await Promise.all([getMyProgress(country), getAccess(), getI18n()]);
  const chapterLabel = (n: number) => {
    const title = country.chapters.find((c) => c.number === n)?.title;
    return !title || title.startsWith("Kapitel") ? t("practiceIndex.chapter", { n }) : title;
  };

  if (!progress.hasData) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold">{t("results.title")}</h1>
        <p className="mt-3 text-muted">{t("results.empty")}</p>
        <ButtonLink href={access.hasFullAccess ? "/ova" : "/ova/gratis"} size="lg" className="mt-8">
          {t("results.start")}
        </ButtonLink>
      </div>
    );
  }

  const { overall, streak, stats, toStudy, review, mastered, totalQuestions, exams } = progress;
  const dateFormat = new Intl.DateTimeFormat(languages[lang].htmlLang, {
    timeZone: country.timeZone,
    day: "numeric",
    month: "short",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <h1 className="text-3xl font-extrabold">{t("results.title")}</h1>

      {/* Översikt */}
      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat icon={<Flame />} value={String(streak.current)} label={t("results.daysInRow")} />
        <Stat icon={<Target />} value={percent(overall.share)} label={t("results.correctOf", { n: overall.total })} />
        <Stat icon={<Trophy />} value={String(mastered)} label={t("results.masteredOf", { n: totalQuestions })} />
      </section>
      {!streak.practicedToday && streak.current > 0 && (
        <p className="-mt-5 rounded-xl bg-cta-soft p-3 text-sm font-semibold text-cta-dark">
          {t("results.keepStreak", { n: streak.current })}
        </p>
      )}

      {/* Repetera fel */}
      {review.length > 0 && (
        <Link
          href="/repetera"
          className="flex items-center gap-3 rounded-2xl border-2 border-primary bg-primary-soft p-4 transition-colors hover:bg-primary hover:text-white"
        >
          <RotateCcw className="shrink-0" aria-hidden />
          <span className="flex-1">
            <span className="block font-bold">{t("results.reviewTitle")}</span>
            <span className="text-sm">{t("results.reviewCount", { n: review.length })}</span>
          </span>
        </Link>
      )}

      {/* Plugga mer på */}
      {toStudy.length > 0 && (
        <section className="rounded-2xl border-2 border-cta bg-cta-soft p-4">
          <h2 className="font-bold">{t("results.studyMore")}</h2>
          <ul className="mt-2 space-y-1">
            {toStudy.map((ch) => {
              const s = stats.find((x) => x.chapter === ch)!;
              return (
                <li key={ch} className="flex flex-wrap items-center gap-x-2">
                  <BookOpen size={16} className="shrink-0 text-cta-dark" aria-hidden />
                  <Link href={`/ova/kapitel/${ch}`} className="font-semibold text-primary underline-offset-2 hover:underline">
                    {chapterLabel(ch)}
                  </Link>
                  <span className="text-sm text-cta-dark">
                    – {s.answers === 0 ? t("results.notPracticed") : t("results.percentCorrect", { p: percent(s.accuracy) })}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Framsteg per kapitel */}
      <section>
        <h2 className="text-xl font-extrabold">{t("results.progressTitle")}</h2>
        <p className="text-sm text-muted">{t("results.progressNote")}</p>
        <ul className="mt-4 space-y-4">
          {stats
            .filter((s) => s.totalQuestions > 0)
            .map((s) => {
              const share = Math.round((s.mastered / s.totalQuestions) * 100);
              return (
                <li key={s.chapter}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-semibold">{chapterLabel(s.chapter)}</span>
                    <span className="shrink-0 text-muted">
                      {t("results.mastered", { m: s.mastered, t: s.totalQuestions })}
                      {s.accuracy !== null && ` · ${t("results.percentCorrect", { p: percent(s.accuracy) })}`}
                    </span>
                  </div>
                  <div className="mt-1 h-3 overflow-hidden rounded-full bg-line" aria-hidden>
                    <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                  </div>
                </li>
              );
            })}
        </ul>
      </section>

      {/* Senaste prov */}
      {exams.length > 0 && (
        <section>
          <h2 className="text-xl font-extrabold">{t("results.recentExams")}</h2>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {exams.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                <span className="text-muted">{dateFormat.format(new Date(e.finished_at))}</span>
                <span className="font-bold" dir="ltr">
                  {e.correct_count}/{e.question_count} ({Math.round((e.correct_count / e.question_count) * 100)} %)
                </span>
                <span className="text-muted">{e.timed_out ? t("results.timedOut") : formatClock(e.duration_seconds * 1000)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <ButtonLink href="/prov" className="flex-1">
          {t("results.takeExam")}
        </ButtonLink>
        <ButtonLink href="/ova" variant="outline" className="flex-1">
          {t("results.practiceChapters")}
        </ButtonLink>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3 text-center">
      <div className="mx-auto mb-1 flex size-8 items-center justify-center text-primary [&>svg]:size-6" aria-hidden>
        {icon}
      </div>
      <p className="text-2xl font-extrabold" dir="ltr">
        {value}
      </p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
