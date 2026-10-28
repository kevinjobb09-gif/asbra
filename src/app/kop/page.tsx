import type { Metadata } from "next";
import { Check } from "lucide-react";
import { formatPrice, getCountry } from "@/config";
import { getI18n } from "@/i18n/server";
import { getAccess } from "@/lib/access";
import { computePrice } from "@/lib/payments/pricing";
import { getActiveRef } from "@/lib/payments/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { getWelcomeCode, normalizeWelcomeCode } from "@/lib/welcome";
import { getFreeSignupEmail } from "@/lib/freeSignup";
import { BuyForm } from "./BuyForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("buy.title"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ avbruten?: string; kod?: string }> };

export default async function BuyPage({ searchParams }: Props) {
  const { avbruten, kod } = await searchParams;
  const country = getCountry();
  const welcomeCode = normalizeWelcomeCode(kod);
  const [{ t }, ref, access, user, welcome] = await Promise.all([
    getI18n(),
    getActiveRef(),
    getAccess(),
    getCurrentUser(),
    welcomeCode ? getWelcomeCode(welcomeCode) : null,
  ]);
  // Den största rabatten gäller: partnerkod (?ref=) eller personlig välkomstkod (?kod=).
  const usableWelcome = welcome && !welcome.used ? welcome : null;
  const useWelcome = !!usableWelcome && usableWelcome.discountPercent > (ref?.discountPercent ?? 0);
  const discount = useWelcome
    ? { code: usableWelcome.code, percent: usableWelcome.discountPercent }
    : ref
      ? { code: ref.code, percent: ref.discountPercent }
      : null;
  const price = computePrice(country.pricing.amount, discount?.percent ?? 0);
  const firstMonth = formatPrice({ ...country, pricing: { ...country.pricing, amount: price.amountMinor / 100 } });
  const monthly = formatPrice(country);

  // Föreslå e-postadressen om användaren redan har ett konto, eller skrev den före gratisfrågorna.
  const knownEmail =
    (useWelcome ? usableWelcome?.email : null) ??
    user?.email ??
    (user?.isAnonymous ? await getFreeSignupEmail(user.id) : null) ??
    undefined;

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
      {access.hasFullAccess && <p className="rounded-xl bg-primary-soft p-3 text-sm">{t("buy.alreadyAccess")}</p>}

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
          {discount && (
            <p className="mb-1 inline-block rounded-full bg-cta-soft px-3 py-1 text-sm font-bold text-cta-dark">
              {t("buy.discount", { code: discount.code, percent: price.discountPercent })}
            </p>
          )}
          {welcomeCode && !usableWelcome && (
            <p className="mb-1 rounded-xl bg-cta-soft px-3 py-2 text-sm font-semibold text-cta-dark">{t("buy.codeInvalid")}</p>
          )}
          <p className="text-4xl font-extrabold">
            <span dir="ltr">{firstMonth}</span> <span className="text-lg font-bold text-muted">{t("offer.perMonth")}</span>
          </p>
          {discount && price.discountMinor > 0 && <p className="text-sm text-muted">{t("buy.thenPrice", { price: monthly })}</p>}
          <p className="mt-2 font-semibold text-primary">{t("offer.noCommitment")}</p>
          <p className="mt-2 text-sm text-muted">{t("buy.subscriptionInfo")}</p>
        </div>
      </section>

      <BuyForm price={firstMonth} defaultEmail={knownEmail} defaultCode={usableWelcome?.code} />
    </div>
  );
}
