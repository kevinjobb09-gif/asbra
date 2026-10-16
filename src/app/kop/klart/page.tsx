import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { getI18n } from "@/i18n/server";
import { getAccess } from "@/lib/access";
import { getStripe, isStripeConfigured, processCheckoutSession } from "@/lib/payments/server";
import { ButtonLink } from "@/components/ButtonLink";
import { RefreshSoon } from "./RefreshSoon";

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ session_id?: string; forsok?: string }> };

/**
 * Tacksidan efter betalningen. Normalt har webhooken redan gett tillgång.
 * Om den inte hunnit frågar vi Stripe direkt och kopplar prenumerationen
 * härifrån (säkert, eftersom inget görs två gånger).
 */
export default async function ThankYouPage({ searchParams }: Props) {
  const { session_id: sessionId, forsok } = await searchParams;
  const { t } = await getI18n();

  let email: string | null = null;
  let paid = false;
  if (sessionId?.startsWith("cs_") && isStripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      email = session.customer_details?.email ?? session.customer_email ?? null;
      if (session.status === "complete" && session.payment_status === "paid") {
        const result = await processCheckoutSession(session);
        paid = result.status === "linked" || result.status === "already-linked";
      }
    } catch (e) {
      console.error("Kunde inte kontrollera betalningen:", e instanceof Error ? e.message : e);
    }
  }

  const access = await getAccess();
  // Utan giltigt köpnummer finns inget att vänta på: visa inloggningen direkt.
  const attempt = sessionId?.startsWith("cs_") ? Number(forsok ?? 0) : 10;

  if (!access.hasFullAccess && paid && email) {
    // Betalningen är klar men kopplades till ett befintligt konto med samma
    // e-post. Den här webbläsaren är inte inloggad på det kontot.
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto size-16 text-primary" aria-hidden />
        <h1 className="mt-4 text-3xl font-extrabold">{t("buy.thanksTitle")}</h1>
        <p className="mt-3 text-lg">{t("buy.loginToAccess", { email })}</p>
        <ButtonLink href="/logga-in" size="lg" className="mt-8 w-full max-w-xs">
          {t("login.title")}
        </ButtonLink>
      </div>
    );
  }

  if (!access.hasFullAccess) {
    // Betalningen bekräftas fortfarande, eller köpet hamnade på ett befintligt
    // konto med samma e-post (då loggar man in med den).
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
      <p className="mt-3 text-lg">{t("buy.thanksText")}</p>
      <p className="mt-2 text-sm text-muted">{t("offer.noCommitment")}</p>
      {email && <p className="mt-3 text-sm text-muted">{t("buy.otherDevice", { email })}</p>}
      <ButtonLink href="/ova" size="lg" className="mt-8 w-full max-w-xs">
        {t("buy.startPracticing")}
      </ButtonLink>
    </div>
  );
}
