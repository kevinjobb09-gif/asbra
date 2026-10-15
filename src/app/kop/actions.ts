"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { brand, getCountry } from "@/config";
import { getI18n } from "@/i18n/server";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computePrice } from "@/lib/payments/pricing";
import { getActiveRef, getStripe, isStripeConfigured, recordEvent } from "@/lib/payments/server";

export type CheckoutState = { error?: string; email?: string };

/** Stripe visar betalsidan på användarens språk när det finns, annars engelska. */
const STRIPE_LOCALES = new Set(["sv", "en", "fr", "es", "pl", "ru", "th", "tr", "vi", "fi", "zh"]);

/**
 * Startar betalningen:
 * 1. kontrollerar e-post och att båda kryssrutorna är ikryssade,
 * 2. sparar köpet och tidpunkten för samtycket,
 * 3. skickar användaren till Stripe Checkout.
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
  // framstegen och köpet hamnar på samma konto.
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

  const country = getCountry();
  const ref = await getActiveRef();
  const price = computePrice(country.pricing.amount, ref?.discountPercent ?? 0);
  const consentAt = new Date().toISOString();

  const db = createAdminClient();
  const { data: purchase, error: insertError } = await db
    .from("purchases")
    .insert({
      user_id: auth.user!.id,
      email,
      country: country.code,
      currency: country.currency,
      list_price_minor: price.listPriceMinor,
      amount_minor: price.amountMinor,
      ref_code: ref?.code ?? null,
      discount_percent: price.discountPercent,
      commission_percent: ref?.commissionPercent ?? 0,
      access_months: country.pricing.accessMonths,
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
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      client_reference_id: purchase.id,
      metadata: { purchase_id: purchase.id, user_id: auth.user!.id, ref_code: ref?.code ?? "" },
      payment_intent_data: { metadata: { purchase_id: purchase.id } },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: country.currency.toLowerCase(),
            unit_amount: price.amountMinor,
            product_data: {
              name: `${brand.name} – ${country.pricing.accessMonths} månaders tillgång`,
              description: "Övning inför medborgarskapsprovet i samhällskunskap. Engångsbetalning, ingen prenumeration.",
            },
          },
        },
      ],
      locale: (STRIPE_LOCALES.has(lang) ? lang : "auto") as "auto",
      custom_text: {
        submit: {
          message:
            "Du får tillgång direkt efter betalningen. Du har samtyckt till att ångerrätten upphör när tillgången börjar.",
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
