"use client";

import { Check, Lock } from "lucide-react";
import { formatPrice, getCountry } from "@/config";
import { useI18n } from "@/i18n/client";
import { ButtonLink } from "./ButtonLink";

type Props = {
  /** Rubriken ovanför erbjudandet, t.ex. resultatet från gratisläget. */
  title?: string;
  intro?: string;
  /** Visa länken "Prova gratis först" (när man inte har provat än). */
  showFreeLink?: boolean;
};

/** Erbjudandet att låsa upp allt. Visas efter gratisläget och på låsta sidor. */
export function UnlockOffer({ title, intro, showFreeLink }: Props) {
  const { t } = useI18n();
  const country = getCountry();
  const { exam, pricing, chapters } = country;
  const price = formatPrice(country);

  const benefits = [
    t("offer.benefitChapters", { n: chapters.length }),
    t("offer.benefitExam", { q: exam.questionCount, m: exam.durationMinutes }),
    t("offer.benefitReview"),
    t("offer.benefitProgress"),
    t("offer.benefitLanguages", { n: country.explanationLanguages.length }),
  ];

  return (
    <section className="overflow-hidden rounded-3xl border-2 border-primary bg-surface shadow-lg shadow-primary/10">
      <div className="bg-primary px-5 py-6 text-center text-white">
        <Lock className="mx-auto mb-2 opacity-80" aria-hidden />
        <h2 className="text-2xl font-extrabold text-balance">{title ?? t("offer.title")}</h2>
        {intro && <p className="mt-2 text-white/85">{intro}</p>}
      </div>
      <div className="space-y-5 p-5">
        <ul className="space-y-2">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <Check className="mt-0.5 shrink-0 text-primary" size={20} strokeWidth={3} aria-hidden />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="text-center">
          <p className="text-4xl font-extrabold" dir="ltr">
            {price}
          </p>
          <p className="text-sm text-muted">{t("offer.payOnce", { months: pricing.accessMonths })}</p>
        </div>
        <ButtonLink href="/kop" size="lg" className="w-full">
          {t("offer.cta", { price })}
        </ButtonLink>
        {showFreeLink && (
          <ButtonLink href="/ova/gratis" variant="outline" className="w-full">
            {t("offer.tryFree")}
          </ButtonLink>
        )}
      </div>
    </section>
  );
}
