import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLanguageCode, LANGUAGE_CODES } from "@/config";
import { getI18n } from "@/i18n/server";
import { HomeContent } from "@/components/HomeContent";

/**
 * Landningssidor per språk, t.ex. /ar och /fa – bra att länka till från TikTok och Instagram.
 * proxy.ts sparar språket i en cookie, så att resten av sajten också visas på det språket.
 */
type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLanguageCode(lang) || lang === "sv") return {};
  const { t } = await getI18n(lang);
  return {
    title: t("common.tagline"),
    description: t("home.subtitle"),
    alternates: {
      canonical: `/${lang}`,
      languages: { sv: "/", ...Object.fromEntries(LANGUAGE_CODES.filter((c) => c !== "sv").map((c) => [c, `/${c}`])) },
    },
  };
}

export default async function LanguageHomePage({ params }: Props) {
  const { lang } = await params;
  if (!isLanguageCode(lang) || lang === "sv") notFound();
  return <HomeContent lang={lang} />;
}
