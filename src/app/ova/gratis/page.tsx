import type { Metadata } from "next";
import { getCountry } from "@/config";
import { isCurrentUserAdmin } from "@/lib/admin/auth";
import { getAllQuestionsForPreview, getFreeQuestionPool } from "@/lib/questions/public";
import { FreePractice } from "@/components/practice/FreePractice";

export const metadata: Metadata = {
  title: "Öva gratis",
  description: "Öva gratis inför medborgarskapsprovet. Inget konto behövs.",
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ utkast?: string }> };

export default async function FreePracticePage({ searchParams }: Props) {
  const country = getCountry();
  const preview = (await searchParams).utkast === "1" && (await isCurrentUserAdmin());
  const pool = preview ? await getAllQuestionsForPreview(country.code) : await getFreeQuestionPool(country.code);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {preview && (
        <p className="mb-4 rounded-xl border-2 border-cta bg-cta-soft p-3 text-sm font-semibold text-cta-dark">
          Förhandsvisning för admin: alla frågor (även utkast) visas. Svar sparas inte.
        </p>
      )}
      <FreePractice pool={pool} limit={country.freeQuestionLimit} preview={preview} />
    </div>
  );
}
