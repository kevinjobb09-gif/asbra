import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { brand } from "@/config";
import { getI18n } from "@/i18n/server";
import { getFreeQuestion } from "@/lib/questions/public";
import { ButtonLink } from "@/components/ButtonLink";
import { RevealAnswer } from "@/components/share/RevealAnswer";

/**
 * DELBAR FRÅGA – t.ex. /fraga/abc123?ref=anna
 * Bara granskade gratisfrågor kan visas här. Förhandsbilden (Open Graph) skapas i opengraph-image.tsx.
 */
type Props = { params: Promise<{ id: string }> };

async function load(id: string, lang: Parameters<typeof getFreeQuestion>[1]) {
  if (!z.uuid().safeParse(id).success) return null;
  return getFreeQuestion(id, lang);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const question = await load(id, "sv");
  if (!question) return {};
  return {
    title: question.question,
    description: `${question.options.map((o, i) => `${"ABCD"[i]}) ${o}`).join("  ")} – ${brand.tagline}`,
    alternates: { canonical: `/fraga/${id}` },
  };
}

export default async function SharedQuestionPage({ params }: Props) {
  const { id } = await params;
  const { t, lang } = await getI18n();
  const question = await load(id, lang);
  if (!question) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <p className="inline-block rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">{t("share.question")}</p>
      <h1 lang="sv" dir="ltr" className="text-2xl leading-snug font-extrabold">
        {question.question}
      </h1>
      <RevealAnswer question={question} />
      <div className="rounded-3xl bg-primary p-6 text-center text-white">
        <p className="text-lg font-bold">{t("home.subtitle")}</p>
        <ButtonLink href="/ova/gratis" size="lg" className="mt-4 w-full max-w-sm">
          {t("share.tryMore")}
        </ButtonLink>
      </div>
    </div>
  );
}
