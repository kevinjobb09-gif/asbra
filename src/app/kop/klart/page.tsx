import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { getCountry, languages } from "@/config";
import { getI18n } from "@/i18n/server";
import { getAccess } from "@/lib/access";
import { fulfill, getStripe, isStripeConfigured, toPaidSession } from "@/lib/payments/server";
import { ButtonLink } from "@/components/ButtonLink";
import { RefreshSoon } from "./RefreshSoon";

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ session_id?: string; forsok?: string }> };

/**
 * Tacksidan efter betalningen. Normalt har webhooken redan gett tillgång.
 * Om den inte hunnit frågar vi Stripe direkt och levererar härifrån (säkert,
 * eftersom leveransen aldrig sker två gånger).
 */
export default async function ThankYouPage({ searchParams }: Props) {
  const { session_id: sessionId, forsok } = await searchParams;
  const country = getCountry();
  const { t, lang } = await getI18n();

  let email: string | null = null;
  if (sessionId?.startsWith("cs_") && isStripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      email = session.customer_details?.email ?? session.customer_email ?? null;
      if (session.payment_status === "paid") await fulfill(toPaidSession(session));
    } catch (e) {
      console.error("Kunde inte kontrollera betalningen:", e instanceof Error ? e.message : e);
    }
  }

  const access = await getAccess();
  const dateFormat = new Intl.DateTimeFormat(languages[lang].htmlLang, { dateStyle: "long", timeZone: country.timeZone });
  const attempt = Number(forsok ?? 0);

  if (!access.expiresAt) {
    // Betalningen bekräftas fortfarande (t.ex. bankbetalning), eller köpet hamnade
    // på ett befintligt konto med samma e-post.
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold">{t("buy.processing")}</h1>
        {attempt >= 10 && <p className="mt-3 text-muted">{t("buy.processingSlow")}</p>}
        {email && <p className="mt-3 text-muted">{t("buy.otherDevice", { email })}</p>}
        {attempt < 10 ? (
          <RefreshSoon href={`/kop/klart?session_id=${encodeURIComponent(sessionId ?? "")}&forsok=${attempt + 1}`} />
        ) : (
          <ButtonLink href="/logga-in" className="mt-6">
            {t("login.title")}
          </ButtonLink>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto size-16 text-primary" aria-hidden />
      <h1 className="mt-4 text-3xl font-extrabold">{t("buy.thanksTitle")}</h1>
      <p className="mt-3 text-lg">{t("buy.thanksText", { date: dateFormat.format(new Date(access.expiresAt)) })}</p>
      {email && <p className="mt-3 text-sm text-muted">{t("buy.otherDevice", { email })}</p>}
      <ButtonLink href="/ova" size="lg" className="mt-8 w-full max-w-xs">
        {t("buy.startPracticing")}
      </ButtonLink>
    </div>
  );
}
