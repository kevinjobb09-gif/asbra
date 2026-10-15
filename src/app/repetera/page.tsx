import type { Metadata } from "next";
import { getCountry } from "@/config";
import { getAccess } from "@/lib/access";
import { getMyProgress } from "@/lib/progress/load";
import { getReviewedQuestionsByIds } from "@/lib/questions/public";
import { ButtonLink } from "@/components/ButtonLink";
import { ReviewPractice } from "@/components/practice/ReviewPractice";
import { UnlockOffer } from "@/components/UnlockOffer";

export const metadata: Metadata = { title: "Repetera fel", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const country = getCountry();
  const access = await getAccess();

  if (!access.hasFullAccess) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <UnlockOffer title="Repetera dina fel" intro="Öva på frågorna du svarat fel på tills du kan dem." showFreeLink />
      </div>
    );
  }

  const { review } = await getMyProgress(country);
  const questions = await getReviewedQuestionsByIds(
    review.map((r) => r.questionId),
    { isAdmin: access.isAdmin },
  );
  const inRow = new Map(review.map((r) => [r.questionId, r.correctInRow]));
  const items = questions.map((q) => ({ question: q, correctInRow: inRow.get(q.id) ?? 0 }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {items.length === 0 ? (
        <div className="py-8 text-center">
          <h1 className="text-3xl font-extrabold">Repetera fel</h1>
          <p className="mt-3 text-muted">Du har inga fel att repetera just nu. Bra jobbat!</p>
          <ButtonLink href="/ova" size="lg" className="mt-8">
            Öva mer
          </ButtonLink>
        </div>
      ) : (
        <ReviewPractice items={items} streakNeeded={country.reviewCorrectStreak} />
      )}
    </div>
  );
}
