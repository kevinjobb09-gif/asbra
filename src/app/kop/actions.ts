"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { brand, getCountry } from "@/config";
import { getI18n } from "@/i18n/server";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computePrice } from "@/lib/payments/pricing";
import { getWelcomeCode, mailboxKey, normalizeWelcomeCode } from "@/lib/welcome";
import {
  getActiveRef,
  getFirstMonthCoupon,
  getStripe,
  getUserSubscription,
  isStripeConfigured,
  recordEvent,
} from "@/lib/payments/server";

export type CheckoutState = { error?: string; email?: string };

/** Stripe visar betalsidan på användarens språk när det finns, annars automatiskt. */
const STRIPE_LOCALES = new Set(["sv", "en", "fr", "es", "pl", "ru", "th", "tr", "vi", "fi", "zh"]);

/**
 * Startar prenumerationen:
 * 1. kontrollerar e-post och att båda kryssrutorna är ikryssade,
 * 2. sparar köpet och tidpunkten för samtycket,
 * 3. skickar användaren till Stripe Checkout (månadsprenumeration, ingen bindningstid).
 */
export async function startCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const { t, lang } = await getI18n();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!z.email().safeParse(email).success) return { error: t("buy.errorEmail"), email };
  if (formData.get("consent_delivery") !== "on" || formData.get("consent_terms") !== "on") {
    return { error: t("buy.errorConsent"), email };
  }
  if (!isStripeConfigured()) return { error: t("buy.errorNotConfigured"), email };

  // Se till att besökaren har en användare (anonym om hen inte övat än), så att
  // framstegen och prenumerationen hamnar på samma konto.
  const supabase = await createClient();
  let { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("Kunde inte skapa anonym användare:", error.message);
      return { error: t("buy.errorPayment"), email };
    }
    auth = { user: data.user! };
  }
  // Har man redan en prenumeration ska man inte kunna starta en till.
  if (await getUserSubscription(auth.user!.id)) return { error: t("buy.alreadyAccess"), email };

  const country = getCountry();
  const ref = await getActiveRef();

  // Personlig välkomstkod: gäller bara med samma e-post och bara en gång.
  const welcomeCode = normalizeWelcomeCode(String(formData.get("code") ?? ""));
  let welcome: Awaited<ReturnType<typeof getWelcomeCode>> = null;
  if (welcomeCode) {
    welcome = await getWelcomeCode(welcomeCode);
    if (!welcome || welcome.used) return { error: t("buy.codeInvalid"), email };
    if (mailboxKey(welcome.email) !== mailboxKey(email)) return { error: t("buy.codeWrongEmail"), email };
  }
  const useWelcome = !!welcome && welcome.discountPercent > (ref?.discountPercent ?? 0);
  const firstMonth = computePrice(country.pricing.amount, useWelcome ? welcome!.discountPercent : (ref?.discountPercent ?? 0));
  const consentAt = new Date().toISOString();

  const db = createAdminClient();
  const { data: purchase, error: insertError } = await db
    .from("purchases")
    .insert({
      user_id: auth.user!.id,
      email,
      country: country.code,
      currency: country.currency,
      list_price_minor: firstMonth.listPriceMinor,
      amount_minor: firstMonth.amountMinor,
      ref_code: ref?.code ?? null,
      ...(useWelcome ? { welcome_code: welcome!.code } : {}),
      discount_percent: firstMonth.discountPercent,
      commission_percent: ref?.commissionPercent ?? 0,
      consent_digital_delivery_at: consentAt,
      consent_terms_at: consentAt,
      language: lang,
    })
    .select("id")
    .single();
  if (insertError) {
    console.error("Kunde inte spara köpet:", insertError.message);
    return { error: t("buy.errorPayment"), email };
  }

  let url: string | null = null;
  try {
    const site = publicEnv.siteUrl.replace(/\/$/, "");
    const metadata = { purchase_id: purchase.id, user_id: auth.user!.id, ref_code: ref?.code ?? "" };
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      client_reference_id: purchase.id,
      metadata,
      subscription_data: { metadata },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: country.currency.toLowerCase(),
            unit_amount: firstMonth.listPriceMinor,
            recurring: { interval: country.pricing.interval },
            product_data: {
              name: `${brand.name} – månadsprenumeration`,
              description: "Övning inför medborgarskapsprovet. Ingen bindningstid – säg upp när du vill.",
            },
          },
        },
      ],
      // Rabatt från en partnerkod gäller första månaden.
      ...(firstMonth.discountPercent > 0 ? { discounts: [{ coupon: await getFirstMonthCoupon(firstMonth.discountPercent) }] } : {}),
      locale: (STRIPE_LOCALES.has(lang) ? lang : "auto") as "auto",
      custom_text: {
        submit: {
          message:
            "Ingen bindningstid. Säg upp när du vill under Konto – direkt och utan extra kostnad. Du har samtyckt till att ångerrätten upphör när tillgången börjar.",
        },
      },
      success_url: `${site}/kop/klart?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/kop?avbruten=1`,
    });
    await db.from("purchases").update({ stripe_session_id: session.id }).eq("id", purchase.id);
    await recordEvent("checkout_opened", { language: lang, refCode: ref?.code });
    url = session.url;
  } catch (e) {
    console.error("Stripe kunde inte starta betalningen:", e instanceof Error ? e.message : e);
  }

  if (!url) return { error: t("buy.errorPayment"), email };
  redirect(url);
}
