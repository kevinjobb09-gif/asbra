import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLanguageCode } from "@/config";
import { hasGuide } from "@/content/guideLanguages";
import { GuideArticle, guideMetadata } from "@/components/GuideArticle";

/** Guiden på andra språk än svenska, t.ex. /ar/guide. Svenska finns på /guide. */
type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLanguageCode(lang) || lang === "sv" || !hasGuide(lang)) return {};
  return guideMetadata(lang);
}

export default async function LanguageGuidePage({ params }: Props) {
  const { lang } = await params;
  if (!isLanguageCode(lang) || lang === "sv" || !hasGuide(lang)) notFound();
  return <GuideArticle lang={lang} />;
}
