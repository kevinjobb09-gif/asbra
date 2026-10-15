import "server-only";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { fulfillPurchase, type FulfillDeps, type PaidSession, type PurchaseRecord } from "./fulfill";
import { normalizeRefCode } from "./pricing";

export const REF_COOKIE = "ref";

let stripe: Stripe | undefined;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Stripe-klient. Kräver STRIPE_SECRET_KEY i miljövariablerna. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY saknas. Lägg till den i .env.local (se .env.example).");
  stripe ??= new Stripe(key, { appInfo: { name: "asbra" } });
  return stripe;
}

export type ActiveRef = { code: string; discountPercent: number; commissionPercent: number };

/** Rabattkoden som besökaren kom med (?ref=kod), om den finns och är aktiv. */
export async function getActiveRef(): Promise<ActiveRef | null> {
  const code = normalizeRefCode((await cookies()).get(REF_COOKIE)?.value);
  if (!code) return null;
  const { data } = await createAdminClient()
    .from("partner_codes")
    .select("code, discount_percent, commission_percent, active")
    .eq("code", code)
    .maybeSingle();
  if (!data?.active) return null;
  return { code: data.code, discountPercent: data.discount_percent, commissionPercent: data.commission_percent };
}

/** Sparar en händelse i statistiken (utan att koppla den till någon användare). */
export async function recordEvent(name: "free_started" | "free_finished" | "checkout_opened" | "paid", extra: { language?: string | null; refCode?: string | null } = {}) {
  const { error } = await createAdminClient()
    .from("analytics_events")
    .insert({ name, language: extra.language ?? null, ref_code: extra.refCode ?? null });
  if (error) console.error("Kunde inte spara statistik:", error.message);
}

/** De riktiga beroendena för leveransen: Supabase med den hemliga nyckeln. */
function realDeps(): FulfillDeps {
  const db = createAdminClient();
  return {
    now: () => new Date(),
    async findPurchase(sessionId, purchaseId) {
      let { data } = await db.from("purchases").select("*").eq("stripe_session_id", sessionId).maybeSingle();
      if (!data && purchaseId) ({ data } = await db.from("purchases").select("*").eq("id", purchaseId).maybeSingle());
      return (data as PurchaseRecord | null) ?? null;
    },
    async findUserIdByEmail(email) {
      const { data, error } = await db.rpc("get_user_id_by_email", { p_email: email });
      if (error) throw new Error(`Kunde inte söka användare: ${error.message}`);
      return (data as string | null) ?? null;
    },
    async moveUserData(from, to) {
      const { error } = await db.rpc("move_user_data", { p_from: from, p_to: to });
      if (error) throw new Error(`Kunde inte flytta data: ${error.message}`);
    },
    async setUserEmail(userId, email) {
      const { error } = await db.auth.admin.updateUserById(userId, { email, email_confirm: true });
      if (error) throw new Error(`Kunde inte spara e-post på kontot: ${error.message}`);
    },
    async createUser(email) {
      const { data, error } = await db.auth.admin.createUser({ email, email_confirm: true });
      if (error || !data.user) throw new Error(`Kunde inte skapa konto: ${error?.message}`);
      return data.user.id;
    },
    async currentAccessExpiry(userId) {
      const { data } = await db
        .from("access_grants")
        .select("expires_at")
        .eq("user_id", userId)
        .order("expires_at", { ascending: false })
        .limit(1);
      return data?.[0] ? new Date(data[0].expires_at) : null;
    },
    async insertAccessGrant({ userId, startsAt, expiresAt, sessionId }) {
      const { error } = await db.from("access_grants").insert({
        user_id: userId,
        source: "purchase",
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        stripe_session_id: sessionId,
      });
      if (error?.code === "23505") return false; // Redan levererad (unik session).
      if (error) throw new Error(`Kunde inte ge tillgång: ${error.message}`);
      return true;
    },
    async markPaid(purchaseId, u) {
      const { error } = await db
        .from("purchases")
        .update({
          status: "paid",
          user_id: u.userId,
          email: u.email,
          paid_at: u.paidAt.toISOString(),
          commission_minor: u.commissionMinor,
          stripe_payment_intent: u.paymentIntent,
        })
        .eq("id", purchaseId);
      if (error) throw new Error(`Kunde inte markera köpet som betalt: ${error.message}`);
    },
    recordEvent: (p) => recordEvent("paid", { language: p.language, refCode: p.ref_code }),
  };
}

/** Gör om en Stripe Checkout-session till det som leveransen behöver. */
export function toPaidSession(s: Stripe.Checkout.Session): PaidSession {
  return {
    sessionId: s.id,
    paymentStatus: s.payment_status,
    email: s.customer_details?.email ?? s.customer_email ?? null,
    paymentIntent: typeof s.payment_intent === "string" ? s.payment_intent : (s.payment_intent?.id ?? null),
    purchaseId: s.client_reference_id ?? s.metadata?.purchase_id ?? null,
  };
}

/** Levererar ett köp (ger tillgång). Säkert att anropa flera gånger. */
export function fulfill(session: PaidSession) {
  return fulfillPurchase(session, realDeps());
}

/** Vid återbetalning: markera köpet och avsluta tillgången direkt. */
export async function revokeRefundedPurchase(paymentIntent: string) {
  const db = createAdminClient();
  const { data: purchase } = await db
    .from("purchases")
    .select("id, stripe_session_id")
    .eq("stripe_payment_intent", paymentIntent)
    .maybeSingle();
  if (!purchase) return;
  await db.from("purchases").update({ status: "refunded" }).eq("id", purchase.id);
  if (purchase.stripe_session_id) {
    await db
      .from("access_grants")
      .update({ expires_at: new Date().toISOString(), starts_at: new Date(Date.now() - 1000).toISOString() })
      .eq("stripe_session_id", purchase.stripe_session_id);
  }
}
