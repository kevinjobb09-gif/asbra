import type { Metadata } from "next";
import { getCountry } from "@/config";
import { getAccess } from "@/lib/access";
import { getI18n } from "@/i18n/server";
import { getMyProgress } from "@/lib/progress/load";
import { getReviewedQuestionsByIds } from "@/lib/questions/public";
import { ButtonLink } from "@/components/ButtonLink";
import { ReviewPractice } from "@/components/practice/ReviewPractice";
import { UnlockOffer } from "@/components/UnlockOffer";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("review.title"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const country = getCountry();
  const [access, { t, lang }] = await Promise.all([getAccess(), getI18n()]);

  if (!access.hasFullAccess) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <UnlockOffer title={t("offer.reviewTitle")} intro={t("offer.reviewIntro")} showFreeLink />
      </div>
    );
  }

  const { review } = await getMyProgress(country);
  const questions = await getReviewedQuestionsByIds(
    review.map((r) => r.questionId),
    { isAdmin: access.isAdmin, lang },
  );
  const inRow = new Map(review.map((r) => [r.questionId, r.correctInRow]));
  const items = questions.map((q) => ({ question: q, correctInRow: inRow.get(q.id) ?? 0 }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {items.length === 0 ? (
        <div className="py-8 text-center">
          <h1 className="text-3xl font-extrabold">{t("review.title")}</h1>
          <p className="mt-3 text-muted">{t("review.none")}</p>
          <ButtonLink href="/ova" size="lg" className="mt-8">
            {t("review.practiceMore")}
          </ButtonLink>
        </div>
      ) : (
        <ReviewPractice items={items} streakNeeded={country.reviewCorrectStreak} />
      )}
    </div>
  );
}
