"use client";

import { brand, getCountry } from "@/config";
import { useI18n } from "@/i18n/client";

/** Friskrivning: tjänsten är privat och inte kopplad till någon myndighet. */
export function Disclaimer({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const country = getCountry();
  return (
    <p className={`text-sm text-muted ${className}`}>
      {t("disclaimer.text", {
        brand: brand.name,
        authorities: country.unaffiliatedAuthorities.join(" / "),
        material: country.studyMaterial.title,
      })}
    </p>
  );
}
