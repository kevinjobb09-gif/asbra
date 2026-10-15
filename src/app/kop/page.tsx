import type { Metadata } from "next";
import { Check } from "lucide-react";
import { formatPrice, getCountry, languages } from "@/config";
import { getI18n } from "@/i18n/server";
import { getAccess } from "@/lib/access";
import { computePrice } from "@/lib/payments/pricing";
import { getActiveRef } from "@/lib/payments/server";
import { createClient } from "@/lib/supabase/server";
import { BuyForm } from "./BuyForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("buy.title"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ avbruten?: string }> };

export default async function BuyPage({ searchParams }: Props) {
  const { avbruten } = await searchParams;
  const country = getCountry();
  const [{ t, lang }, ref, access] = await Promise.all([getI18n(), getActiveRef(), getAccess()]);
  const price = computePrice(country.pricing.amount, ref?.discountPercent ?? 0);
  const formatted = formatPrice({ ...country, pricing: { ...country.pricing, amount: price.amountMinor / 100 } });
  const listPrice = formatPrice(country);

  // Föreslå e-postadressen om användaren redan har ett konto.
  const { data } = await (await createClient()).auth.getUser();
  const knownEmail = data.user?.email ?? undefined;
  const dateFormat = new Intl.DateTimeFormat(languages[lang].htmlLang, { dateStyle: "long", timeZone: country.timeZone });

  const benefits = [
    t("offer.benefitChapters", { n: country.chapters.length }),
    t("offer.benefitExam", { q: country.exam.questionCount, m: country.exam.durationMinutes }),
    t("offer.benefitReview"),
    t("offer.benefitLanguages", { n: country.explanationLanguages.length }),
  ];

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <h1 className="text-3xl font-extrabold">{t("buy.title")}</h1>

      {avbruten && <p className="rounded-xl bg-cta-soft p-3 text-sm font-semibold text-cta-dark">{t("buy.canceled")}</p>}
      {access.expiresAt && (
        <p className="rounded-xl bg-primary-soft p-3 text-sm">
          {t("buy.alreadyAccess", { date: dateFormat.format(new Date(access.expiresAt)), months: country.pricing.accessMonths })}
        </p>
      )}

      <section className="rounded-3xl border-2 border-primary bg-surface p-5">
        <ul className="space-y-2">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <Check className="mt-0.5 shrink-0 text-primary" size={20} strokeWidth={3} aria-hidden />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 text-center">
          {ref && (
            <p className="mb-1 inline-block rounded-full bg-cta-soft px-3 py-1 text-sm font-bold text-cta-dark">
              {t("buy.discount", { code: ref.code, percent: price.discountPercent })}
            </p>
          )}
          <p className="text-4xl font-extrabold" dir="ltr">
            {formatted}
          </p>
          {ref && price.discountMinor > 0 && (
            <p className="text-sm text-muted line-through" dir="ltr">
              {t("buy.originalPrice", { price: listPrice })}
            </p>
          )}
          <p className="text-sm text-muted">{t("offer.payOnce", { months: country.pricing.accessMonths })}</p>
        </div>
      </section>

      <BuyForm price={formatted} defaultEmail={knownEmail} />
    </div>
  );
}
