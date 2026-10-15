import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_Arabic, Noto_Sans_Ethiopic, Noto_Sans_Thai } from "next/font/google";
import { brand, getCountry, languages } from "@/config";
import { getI18n, getLanguageChoice } from "@/i18n/server";
import { I18nProvider } from "@/i18n/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { RefBanner } from "@/components/RefBanner";
import { LanguageNotice } from "@/components/LanguagePicker";
import "./globals.css";

// Ett typsnitt per skriftsystem. Webbläsaren laddar bara de tecken som faktiskt
// används på sidan, så arabiska typsnitt laddas inte för den som läser svenska.
const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext", "vietnamese"],
  display: "swap",
});
const notoArabic = Noto_Sans_Arabic({ variable: "--font-arabic", subsets: ["arabic"], display: "swap", preload: false });
const notoEthiopic = Noto_Sans_Ethiopic({ variable: "--font-ethiopic", subsets: ["ethiopic"], display: "swap", preload: false });
const notoThai = Noto_Sans_Thai({ variable: "--font-thai", subsets: ["thai"], display: "swap", preload: false });

const country = getCountry();

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${brand.name} – Öva inför medborgarskapsprovet`,
    template: `%s | ${brand.name}`,
  },
  description: `Öva inför medborgarskapsprovet i samhällskunskap. Frågor på svenska med förklaringar på ditt eget språk. Bygger på ${country.studyMaterial.title}.`,
  applicationName: brand.name,
  appleWebApp: { capable: true, title: brand.shortName, statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: brand.colors.background,
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [{ lang, dir, messages }, choice] = await Promise.all([getI18n(), getLanguageChoice()]);
  const fonts = [notoSans, notoArabic, notoEthiopic, notoThai].map((f) => f.variable).join(" ");

  return (
    <html lang={languages[lang].htmlLang} dir={dir}>
      <body className={`${fonts} flex min-h-dvh flex-col antialiased`}>
        <I18nProvider lang={lang} messages={messages}>
          <SiteHeader />
          <RefBanner />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <LanguageNotice show={!choice.hasChosen} suggested={choice.suggested} />
        </I18nProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
