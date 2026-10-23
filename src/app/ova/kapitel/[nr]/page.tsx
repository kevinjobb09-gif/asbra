import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCountry } from "@/config";
import { getAccess } from "@/lib/access";
import { getI18n } from "@/i18n/server";
import { shuffle } from "@/lib/practice/session";
import { getAllQuestionsForPreview, getChapterQuestions } from "@/lib/questions/public";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { UnlockOffer } from "@/components/UnlockOffer";

type Props = {
  params: Promise<{ nr: string }>;
  searchParams: Promise<{ utkast?: string }>;
};

function findChapter(nr: string) {
  return getCountry().chapters.find((c) => String(c.number) === nr);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const chapter = findChapter((await params).nr);
  const { t } = await getI18n();
  if (!chapter) return { title: t("practiceIndex.title") };
  return {
    title: `${chapter.title} – ${t("practiceIndex.chapter", { n: chapter.number })}`,
    description: t("seo.chapterDescription", { chapter: chapter.title }),
    alternates: { canonical: `/ova/kapitel/${chapter.number}` },
  };
}

export default async function ChapterPracticePage({ params, searchParams }: Props) {
  const { nr } = await params;
  const { utkast } = await searchParams;
  const country = getCountry();
  const chapter = findChapter(nr);
  if (!chapter) notFound();

  const [access, { t, lang }] = await Promise.all([getAccess(), getI18n()]);
  // Förhandsvisning av utkast – bara för admin.
  const preview = utkast === "1" && access.isAdmin;

  if (!preview && !access.hasFullAccess) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <UnlockOffer title={t("offer.chapterTitle", { n: chapter.number })} intro={t("offer.chapterIntro")} showFreeLink />
      </div>
    );
  }

  const questions = preview
    ? await getAllQuestionsForPreview(country.code, { chapter: chapter.number, lang })
    : await getChapterQuestions(country.code, chapter.number, { isAdmin: access.isAdmin, lang });

  // Platshållarnamn ("Kapitel 3") visas utan dubblering.
  const label = chapter.title.startsWith("Kapitel")
    ? t("practiceIndex.chapter", { n: chapter.number })
    : `${t("practiceIndex.chapter", { n: chapter.number })}: ${chapter.title}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {preview && (
        <p className="mb-4 rounded-xl border-2 border-cta bg-cta-soft p-3 text-sm font-semibold text-cta-dark" lang="sv" dir="ltr">
          Förhandsvisning för admin: även utkast visas. Svar sparas inte.
        </p>
      )}
      {questions.length === 0 ? (
        <div className="py-12 text-center">
          <h1 className="text-2xl font-extrabold">{label}</h1>
          <p className="mt-2 text-muted">{t("practiceIndex.noQuestions")}</p>
          <Link href="/ova" className="mt-6 inline-block font-semibold text-primary">
            {t("practiceIndex.chooseOther")}
          </Link>
        </div>
      ) : (
        <PracticeSession questions={shuffle(questions)} chapterLabel={label} preview={preview} />
      )}
    </div>
  );
}
