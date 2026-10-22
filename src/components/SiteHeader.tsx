"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, UserRound } from "lucide-react";
import { brand } from "@/config";
import { useI18n } from "@/i18n/client";
import { ButtonLink } from "./ButtonLink";
import { LanguagePicker } from "./LanguagePicker";

export function SiteHeader() {
  const { t } = useI18n();
  const pathname = usePathname();
  // Adminsidan har en egen meny och är alltid på svenska.
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-1 px-3 sm:px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2 text-lg font-extrabold text-primary" dir="ltr">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            {brand.initial}
          </span>
          <span className="truncate">{brand.name}</span>
        </Link>
        <nav className="flex items-center gap-0.5">
          <LanguagePicker />
          <Link
            href="/resultat"
            prefetch
            aria-label={t("common.results")}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-semibold hover:bg-primary-soft"
          >
            <BarChart3 size={18} aria-hidden />
            <span className="hidden sm:inline">{t("common.results")}</span>
          </Link>
          <Link
            href="/konto"
            prefetch
            aria-label={t("common.account")}
            className="flex items-center rounded-full px-2.5 py-2 text-sm font-semibold hover:bg-primary-soft"
          >
            <UserRound size={18} aria-hidden />
          </Link>
          <ButtonLink href="/ova" prefetch variant="cta" className="ms-1 !px-4 !py-2 text-sm">
            {t("common.practice")}
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
