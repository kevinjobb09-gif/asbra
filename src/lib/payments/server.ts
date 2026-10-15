import "server-only";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  handleCheckoutCompleted,
  recordPayment,
  syncSubscription,
  type CheckoutDeps,
  type CompletedCheckout,
  type PurchaseRecord,
  type StripeSubscriptionState,
} from "./fulfill";
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
export async function recordEvent(
  name: "free_started" | "free_finished" | "checkout_opened" | "paid",
  extra: { language?: string | null; refCode?: string | null } = {},
) {
  const { error } = await createAdminClient()
    .from("analytics_events")
    .insert({ name, language: extra.language ?? null, ref_code: extra.refCode ?? null });
  if (error) console.error("Kunde inte spara statistik:", error.message);
}

/**
 * Stripe-kupong för rabatt FÖRSTA MÅNADEN (t.ex. 20 %). Skapas en gång per
 * procentsats och återanvänds sedan.
 */
export async function getFirstMonthCoupon(percent: number): Promise<string> {
  const id = `forsta-manaden-${percent}`;
  const s = getStripe();
  try {
    await s.coupons.retrieve(id);
  } catch {
    await s.coupons.create({ id, percent_off: percent, duration: "once", name: `${percent} % rabatt första månaden` });
  }
  return id;
}

// ---------------------------------------------------------------------------
// Översättning från Stripes objekt till det logiken behöver
// ---------------------------------------------------------------------------

const idOf = (x: string | { id: string } | null | undefined) => (typeof x === "string" ? x : (x?.id ?? null));

export function toCompletedCheckout(s: Stripe.Checkout.Session): CompletedCheckout {
  return {
    sessionId: s.id,
    status: s.status ?? "",
    paymentStatus: s.payment_status,
    email: s.customer_details?.email ?? s.customer_email ?? null,
    purchaseId: s.client_reference_id ?? s.metadata?.purchase_id ?? null,
    subscriptionId: idOf(s.subscription),
    customerId: idOf(s.customer),
  };
}

export function toSubscriptionState(sub: Stripe.Subscription): StripeSubscriptionState {
  // Periodens slut finns på prenumerationens rader (vi har bara en rad).
  const ends = sub.items.data.map((i) => i.current_period_end).filter(Boolean);
  return {
    id: sub.id,
    status: sub.status,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    periodEnd: ends.length ? new Date(Math.max(...ends) * 1000) : null,
    startedAt: new Date(sub.start_date * 1000),
  };
}

// ---------------------------------------------------------------------------
// De riktiga beroendena: Supabase med den hemliga nyckeln
// ---------------------------------------------------------------------------

function checkoutDeps(): CheckoutDeps {
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
    async saveSubscriptionOwner(s) {
      const { error } = await db.from("subscriptions").upsert(
        {
          stripe_subscription_id: s.subscriptionId,
          stripe_customer_id: s.customerId,
          user_id: s.userId,
          ref_code: s.refCode,
          commission_percent: s.commissionPercent,
        },
        { onConflict: "stripe_subscription_id" },
      );
      if (error) throw new Error(`Kunde inte spara prenumerationen: ${error.message}`);
    },
    async markPurchasePaid(purchaseId, u) {
      const { error } = await db
        .from("purchases")
        .update({ status: "paid", user_id: u.userId, email: u.email, paid_at: u.paidAt.toISOString(), stripe_subscription_id: u.subscriptionId })
        .eq("id", purchaseId);
      if (error) throw new Error(`Kunde inte markera köpet: ${error.message}`);
    },
    recordEvent: (p) => recordEvent("paid", { language: p.language, refCode: p.ref_code }),
  };
}

async function sync(sub: Stripe.Subscription) {
  const db = createAdminClient();
  return syncSubscription(toSubscriptionState(sub), {
    now: () => new Date(),
    async findOwner(id) {
      const { data } = await db.from("subscriptions").select("user_id").eq("stripe_subscription_id", id).maybeSingle();
      return data?.user_id ?? null;
    },
    async updateSubscription(s) {
      const { error } = await db
        .from("subscriptions")
        .update({
          status: s.status,
          cancel_at_period_end: s.cancelAtPeriodEnd,
          current_period_end: s.periodEnd?.toISOString() ?? null,
        })
        .eq("stripe_subscription_id", s.id);
      if (error) throw new Error(`Kunde inte uppdatera prenumerationen: ${error.message}`);
    },
    async setAccess({ subscriptionId, userId, startsAt, expiresAt }) {
      // Ingen tillgång = sluttiden sätts till nu (starttiden en sekund innan, så att raden är giltig).
      const now = Date.now();
      const ends = expiresAt ?? new Date(now);
      const starts = startsAt < ends ? startsAt : new Date(ends.getTime() - 1000);
      const { error } = await db.from("access_grants").upsert(
        {
          user_id: userId,
          source: "subscription",
          stripe_subscription_id: subscriptionId,
          starts_at: starts.toISOString(),
          expires_at: ends.toISOString(),
        },
        { onConflict: "stripe_subscription_id" },
      );
      if (error) throw new Error(`Kunde inte uppdatera tillgången: ${error.message}`);
    },
  });
}

// ---------------------------------------------------------------------------
// Det webhooken och tacksidan anropar
// ---------------------------------------------------------------------------

/** Köpet är klart: koppla prenumerationen till rätt konto och ge tillgång. */
export async function processCheckoutSession(session: Stripe.Checkout.Session) {
  const result = await handleCheckoutCompleted(toCompletedCheckout(session), checkoutDeps());
  if (result.status === "linked" || result.status === "already-linked") {
    await sync(await getStripe().subscriptions.retrieve(result.subscriptionId));
  }
  return result;
}

/** Prenumerationen har ändrats hos Stripe (förnyad, uppsagd, avslutad …). */
export function processSubscription(sub: Stripe.Subscription) {
  return sync(sub);
}

/** En månad är betald: spara betalningen och förläng tillgången. */
export async function processInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = idOf(invoice.parent?.subscription_details?.subscription);
  if (!subscriptionId || !invoice.id) return { status: "not-subscription" as const };
  const sub = await getStripe().subscriptions.retrieve(subscriptionId);

  // Första fakturan kan komma före "köpet är klart". Koppla då kontot härifrån.
  const db = createAdminClient();
  const { data: owner } = await db.from("subscriptions").select("user_id").eq("stripe_subscription_id", subscriptionId).maybeSingle();
  const purchaseId = sub.metadata?.purchase_id ?? null;
  if (!owner && purchaseId) {
    const { data: purchase } = await db.from("purchases").select("stripe_session_id").eq("id", purchaseId).maybeSingle();
    await handleCheckoutCompleted(
      {
        sessionId: purchase?.stripe_session_id ?? "",
        status: "complete",
        paymentStatus: "paid",
        email: invoice.customer_email ?? null,
        purchaseId,
        subscriptionId,
        customerId: idOf(invoice.customer),
      },
      checkoutDeps(),
    );
  }

  await recordPayment(
    {
      invoiceId: invoice.id,
      subscriptionId,
      amountMinor: invoice.amount_paid,
      currency: invoice.currency.toUpperCase(),
      paidAt: new Date((invoice.status_transitions?.paid_at ?? Math.floor(Date.now() / 1000)) * 1000),
    },
    {
      async findSubscription(id) {
        const { data } = await db
          .from("subscriptions")
          .select("user_id, ref_code, commission_percent")
          .eq("stripe_subscription_id", id)
          .maybeSingle();
        return data ? { userId: data.user_id, refCode: data.ref_code, commissionPercent: data.commission_percent } : null;
      },
      async insertPayment(p) {
        const { error } = await db.from("payments").upsert(
          {
            stripe_invoice_id: p.invoiceId,
            stripe_subscription_id: p.subscriptionId,
            user_id: p.userId,
            amount_minor: p.amountMinor,
            currency: p.currency,
            ref_code: p.refCode,
            commission_minor: p.commissionMinor,
            paid_at: p.paidAt.toISOString(),
          },
          { onConflict: "stripe_invoice_id", ignoreDuplicates: true },
        );
        if (error) throw new Error(`Kunde inte spara betalningen: ${error.message}`);
      },
    },
  );
  return sync(sub);
}

// ---------------------------------------------------------------------------
// Kundens egna åtgärder
// ---------------------------------------------------------------------------

export type UserSubscription = {
  id: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  periodEnd: string | null;
};

/** Användarens senaste prenumeration som fortfarande gäller (aktiv eller uppsagd men inte slut). */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const { data } = await createAdminClient()
    .from("subscriptions")
    .select("stripe_subscription_id, status, cancel_at_period_end, current_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due"])
    .order("current_period_end", { ascending: false })
    .limit(1);
  const s = data?.[0];
  return s
    ? { id: s.stripe_subscription_id, status: s.status, cancelAtPeriodEnd: s.cancel_at_period_end, periodEnd: s.current_period_end }
    : null;
}

/** Säg upp (eller ångra uppsägningen). Tillgången gäller till periodens slut. Inget mer dras. */
export async function setCancelAtPeriodEnd(userId: string, cancel: boolean) {
  const sub = await getUserSubscription(userId);
  if (!sub) throw new Error("Ingen aktiv prenumeration.");
  const updated = await getStripe().subscriptions.update(sub.id, { cancel_at_period_end: cancel });
  await sync(updated);
  return toSubscriptionState(updated);
}

/** Avslutar alla prenumerationer direkt (när kontot raderas). */
export async function cancelAllSubscriptionsNow(userId: string) {
  if (!isStripeConfigured()) return;
  const { data } = await createAdminClient()
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due", "incomplete"]);
  for (const s of data ?? []) {
    try {
      await getStripe().subscriptions.cancel(s.stripe_subscription_id);
    } catch (e) {
      console.error("Kunde inte avsluta prenumeration:", e instanceof Error ? e.message : e);
    }
  }
}
