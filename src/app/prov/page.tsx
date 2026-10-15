import type { Metadata } from "next";
import { getCountry } from "@/config";
import { getAccess } from "@/lib/access";
import { getAllQuestionsForPreview, getAllReviewedQuestions } from "@/lib/questions/public";
import { ExamSession } from "@/components/exam/ExamSession";
import { UnlockOffer } from "@/components/UnlockOffer";

export const metadata: Metadata = {
  title: "Provsimulering",
  description: "Gör ett provtest med samma antal frågor och samma tid som medborgarskapsprovet.",
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ utkast?: string; minuter?: string }> };

export default async function ExamPage({ searchParams }: Props) {
  const { utkast, minuter } = await searchParams;
  const country = getCountry();
  const access = await getAccess();
  const preview = utkast === "1" && access.isAdmin;

  if (!preview && !access.hasFullAccess) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <UnlockOffer title="Gör ett riktigt provtest" intro="Provsimuleringen ingår när du låser upp allt." showFreeLink />
      </div>
    );
  }

  const pool = preview
    ? await getAllQuestionsForPreview(country.code)
    : await getAllReviewedQuestions(country.code, { isAdmin: access.isAdmin });

  // Admin kan korta tiden för att testa nedräkningen, t.ex. /prov?utkast=1&minuter=1
  const testMinutes = preview ? Number(minuter) : NaN;
  const timeLimitSeconds =
    Number.isFinite(testMinutes) && testMinutes > 0 ? Math.round(testMinutes * 60) : country.exam.durationMinutes * 60;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {preview && (
        <p className="mb-4 rounded-xl border-2 border-cta bg-cta-soft p-3 text-sm font-semibold text-cta-dark">
          Förhandsvisning för admin: även utkast visas och inget sparas.
          {timeLimitSeconds !== country.exam.durationMinutes * 60 && ` Testtid: ${minuter} min.`}
        </p>
      )}
      <ExamSession
        pool={pool}
        questionCount={country.exam.questionCount}
        timeLimitSeconds={timeLimitSeconds}
        passThreshold={country.exam.passThreshold}
        chapters={country.chapters}
        country={country.code}
        officialInfoUrl={country.exam.officialInfoUrl}
        preview={preview}
      />
    </div>
  );
}
