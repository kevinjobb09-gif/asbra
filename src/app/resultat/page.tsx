import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Flame, RotateCcw, Target, Trophy } from "lucide-react";
import { getCountry } from "@/config";
import { getAccess } from "@/lib/access";
import { getMyProgress } from "@/lib/progress/load";
import { formatClock } from "@/lib/exam/timer";
import { ButtonLink } from "@/components/ButtonLink";

export const metadata: Metadata = { title: "Mina resultat", robots: { index: false } };
export const dynamic = "force-dynamic";

const percent = (share: number | null) => (share === null ? "–" : `${Math.round(share * 100)} %`);

export default async function ResultsPage() {
  const country = getCountry();
  const [progress, access] = await Promise.all([getMyProgress(country), getAccess()]);
  const chapterTitle = (n: number) => country.chapters.find((c) => c.number === n)?.title ?? `Kapitel ${n}`;

  if (!progress.hasData) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold">Mina resultat</h1>
        <p className="mt-3 text-muted">Du har inte svarat på några frågor än. Dina resultat visas här när du har börjat öva.</p>
        <ButtonLink href={access.hasFullAccess ? "/ova" : "/ova/gratis"} size="lg" className="mt-8">
          Börja öva
        </ButtonLink>
      </div>
    );
  }

  const { overall, streak, stats, toStudy, review, mastered, totalQuestions, exams } = progress;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <h1 className="text-3xl font-extrabold">Mina resultat</h1>

      {/* Översikt */}
      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat icon={<Flame />} value={String(streak.current)} label={streak.current === 1 ? "dag i rad" : "dagar i rad"} />
        <Stat icon={<Target />} value={percent(overall.share)} label={`rätt av ${overall.total} svar`} />
        <Stat icon={<Trophy />} value={`${mastered}`} label={`av ${totalQuestions} frågor klarade`} />
      </section>
      {!streak.practicedToday && streak.current > 0 && (
        <p className="-mt-5 rounded-xl bg-cta-soft p-3 text-sm font-semibold text-cta-dark">
          Öva en fråga i dag för att behålla din serie på {streak.current} {streak.current === 1 ? "dag" : "dagar"}!
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
            <span className="block font-bold">Repetera fel</span>
            <span className="text-sm">
              {review.length} {review.length === 1 ? "fråga" : "frågor"} att öva på igen
            </span>
          </span>
        </Link>
      )}

      {/* Plugga mer på */}
      {toStudy.length > 0 && (
        <section className="rounded-2xl border-2 border-cta bg-cta-soft p-4">
          <h2 className="font-bold">Plugga mer på</h2>
          <ul className="mt-2 space-y-1">
            {toStudy.map((ch) => {
              const s = stats.find((x) => x.chapter === ch)!;
              return (
                <li key={ch} className="flex items-center gap-2">
                  <BookOpen size={16} className="shrink-0 text-cta-dark" aria-hidden />
                  <Link href={`/ova/kapitel/${ch}`} className="font-semibold text-primary underline-offset-2 hover:underline">
                    {chapterTitle(ch)}
                  </Link>
                  <span className="text-sm text-cta-dark">{s.answers === 0 ? "– inte övat än" : `– ${percent(s.accuracy)} rätt`}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Framsteg per kapitel */}
      <section>
        <h2 className="text-xl font-extrabold">Framsteg per kapitel</h2>
        <p className="text-sm text-muted">En fråga räknas som klarad när ditt senaste svar på den var rätt.</p>
        <ul className="mt-4 space-y-4">
          {stats.filter((s) => s.totalQuestions > 0).map((s) => {
            const share = s.totalQuestions ? Math.round((s.mastered / s.totalQuestions) * 100) : 0;
            return (
              <li key={s.chapter}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-semibold">{chapterTitle(s.chapter)}</span>
                  <span className="shrink-0 text-muted">
                    {s.mastered}/{s.totalQuestions} klarade
                    {s.accuracy !== null && ` · ${percent(s.accuracy)} rätt`}
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
          <h2 className="text-xl font-extrabold">Senaste provtest</h2>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {exams.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                <span className="text-muted">
                  {new Date(e.finished_at).toLocaleDateString("sv-SE", { timeZone: country.timeZone, day: "numeric", month: "short" })}
                </span>
                <span className="font-bold">
                  {e.correct_count} av {e.question_count} ({Math.round((e.correct_count / e.question_count) * 100)} %)
                </span>
                <span className="text-muted">{e.timed_out ? "Tiden tog slut" : formatClock(e.duration_seconds * 1000)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <ButtonLink href="/prov" className="flex-1">
          Gör ett provtest
        </ButtonLink>
        <ButtonLink href="/ova" variant="outline" className="flex-1">
          Öva per kapitel
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
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
