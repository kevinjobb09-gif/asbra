import type { Metadata, Viewport } from "next";
import { Noto_Sans } from "next/font/google";
import { brand, getCountry } from "@/config";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

// Noto Sans klarar å, ä, ö och de flesta latinska tecken. Arabiska och
// tigrinja-typsnitt läggs till i delmålet om språk.
const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" dir="ltr">
      <body className={`${notoSans.variable} flex min-h-dvh flex-col antialiased`}>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
