"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "@/config";
import { useI18n } from "@/i18n/client";
import { WELCOME_DISCOUNT_PERCENT } from "@/lib/payments/pricing";
import { guidePath, hasGuide } from "@/content/guideLanguages";
import { Disclaimer } from "./Disclaimer";

export function SiteFooter() {
  const { t, lang } = useI18n();
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <Disclaimer />
        {lang !== "sv" && <p className="text-xs text-muted">{t("common.machineTranslatedSite")}</p>}
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
          <Link href="/rabatt" className="font-semibold text-cta-dark hover:text-primary">{t("welcome.nav", { percent: WELCOME_DISCOUNT_PERCENT })}</Link>
          <Link href={guidePath(hasGuide(lang) ? lang : "sv")} className="hover:text-primary">{t("footer.guide")}</Link>
          <Link href="/villkor" className="hover:text-primary">{t("footer.terms")}</Link>
          <Link href="/integritet" className="hover:text-primary">{t("footer.privacy")}</Link>
          <Link href="/om" className="hover:text-primary">{t("footer.about")}</Link>
          <Link href="/kontakt" className="hover:text-primary">{t("footer.contact")}</Link>
        </nav>
        <p className="text-xs text-muted" dir="ltr">
          © {new Date().getFullYear()} {brand.company.legalName}
        </p>
      </div>
    </footer>
  );
}
