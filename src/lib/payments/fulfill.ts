import { commissionMinor } from "./pricing";

/**
 * PRENUMERATION: KÖP, FÖRNYELSE OCH UPPSÄGNING
 *
 * Allt här kan anropas flera gånger för samma händelse utan att något händer
 * två gånger ("idempotent"). Stripe skickar ibland samma händelse igen.
 * Databas och Stripe skickas in som `deps`, så att logiken kan testas utan dem.
 */

/** Hur länge tillgången räcker efter periodens slut, om förnyelsen dröjer några timmar. */
export const RENEWAL_GRACE_MS = 24 * 60 * 60 * 1000;

export type PurchaseRecord = {
  id: string;
  user_id: string | null;
  email: string | null;
  status: "pending" | "paid" | "refunded" | "expired";
  ref_code: string | null;
  commission_percent: number;
  language: string | null;
};

// ---------------------------------------------------------------------------
// 1. Köpet är klart (Stripe Checkout)
// ---------------------------------------------------------------------------

export type CompletedCheckout = {
  sessionId: string;
  /** "complete" när kunden har gått igenom betalningen. */
  status: string;
  paymentStatus: string;
  email: string | null;
  purchaseId: string | null;
  subscriptionId: string | null;
  customerId: string | null;
};

export type CheckoutDeps = {
  now: () => Date;
  findPurchase: (sessionId: string, purchaseId: string | null) => Promise<PurchaseRecord | null>;
  findUserIdByEmail: (email: string) => Promise<string | null>;
  moveUserData: (fromUserId: string, toUserId: string) => Promise<void>;
  /** Ger en (anonym) användare en e-postadress, så att kontot blir permanent. */
  setUserEmail: (userId: string, email: string) => Promise<void>;
  createUser: (email: string) => Promise<string>;
  saveSubscriptionOwner: (s: {
    subscriptionId: string;
    customerId: string | null;
    userId: string;
    refCode: string | null;
    commissionPercent: number;
  }) => Promise<void>;
  markPurchasePaid: (purchaseId: string, u: { userId: string; email: string; paidAt: Date; subscriptionId: string }) => Promise<void>;
  recordEvent: (purchase: PurchaseRecord) => Promise<void>;
};

export type CheckoutResult =
  | { status: "linked"; userId: string; subscriptionId: string; mergedIntoExisting: boolean }
  | { status: "already-linked"; userId: string; subscriptionId: string }
  | { status: "not-paid" | "unknown-purchase" | "missing-email" | "missing-subscription" };

/**
 * Kopplar prenumerationen till rätt användare:
 * 1. Finns redan ett konto med e-postadressen → använd det och flytta över framstegen.
 * 2. Annars → ge den anonyma användaren e-postadressen (kontot skapas vid köp).
 * 3. Ingen användare alls → skapa ett nytt konto.
 * Själva tillgången ges av syncSubscription (nedan), utifrån Stripes status.
 */
export async function handleCheckoutCompleted(c: CompletedCheckout, deps: CheckoutDeps): Promise<CheckoutResult> {
  if (c.status !== "complete" || c.paymentStatus !== "paid") return { status: "not-paid" };
  if (!c.subscriptionId) return { status: "missing-subscription" };

  const purchase = await deps.findPurchase(c.sessionId, c.purchaseId);
  if (!purchase) return { status: "unknown-purchase" };
  if (purchase.status === "paid" && purchase.user_id) {
    return { status: "already-linked", userId: purchase.user_id, subscriptionId: c.subscriptionId };
  }

  const email = (c.email ?? purchase.email)?.trim().toLowerCase();
  if (!email) return { status: "missing-email" };

  const existing = await deps.findUserIdByEmail(email);
  let userId: string;
  let mergedIntoExisting = false;
  if (existing) {
    if (purchase.user_id && purchase.user_id !== existing) {
      await deps.moveUserData(purchase.user_id, existing);
      mergedIntoExisting = true;
    }
    userId = existing;
  } else if (purchase.user_id) {
    await deps.setUserEmail(purchase.user_id, email);
    userId = purchase.user_id;
  } else {
    userId = await deps.createUser(email);
  }

  await deps.saveSubscriptionOwner({
    subscriptionId: c.subscriptionId,
    customerId: c.customerId,
    userId,
    refCode: purchase.ref_code,
    commissionPercent: purchase.commission_percent,
  });
  await deps.markPurchasePaid(purchase.id, { userId, email, paidAt: deps.now(), subscriptionId: c.subscriptionId });
  await deps.recordEvent(purchase);

  return { status: "linked", userId, subscriptionId: c.subscriptionId, mergedIntoExisting };
}

// ---------------------------------------------------------------------------
// 2. Prenumerationen ändras (förnyad, uppsagd, avslutad, betalning misslyckad)
// ---------------------------------------------------------------------------

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused"
  | string;

/**
 * Hur länge ska användaren ha tillgång? null = ingen tillgång (från och med nu).
 * - Aktiv (även uppsagd men inte slut än): till periodens slut + ett dygns marginal
 *   om förnyelsen dröjer.
 * - Betalningen misslyckades men Stripe försöker igen (past_due): till periodens slut.
 * - Avslutad, obetald eller aldrig startad: ingen tillgång.
 */
export function accessUntil(status: SubscriptionStatus, periodEnd: Date | null, now: Date): Date | null {
  if (!periodEnd) return null;
  if (status === "active" || status === "trialing") return new Date(periodEnd.getTime() + RENEWAL_GRACE_MS);
  if (status === "past_due") return periodEnd > now ? periodEnd : null;
  return null;
}

export type StripeSubscriptionState = {
  id: string;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  periodEnd: Date | null;
  startedAt: Date;
};

export type SyncDeps = {
  now: () => Date;
  findOwner: (subscriptionId: string) => Promise<string | null>;
  updateSubscription: (s: StripeSubscriptionState) => Promise<void>;
  /** Skapar eller uppdaterar tillgången för prenumerationen. expiresAt null = stäng av nu. */
  setAccess: (a: { subscriptionId: string; userId: string; startsAt: Date; expiresAt: Date | null }) => Promise<void>;
};

/** Uppdaterar databasen och tillgången utifrån prenumerationens läge hos Stripe. */
export async function syncSubscription(s: StripeSubscriptionState, deps: SyncDeps) {
  const owner = await deps.findOwner(s.id);
  if (!owner) return { status: "no-owner" as const };
  await deps.updateSubscription(s);
  const expiresAt = accessUntil(s.status, s.periodEnd, deps.now());
  await deps.setAccess({ subscriptionId: s.id, userId: owner, startsAt: s.startedAt, expiresAt });
  return { status: "synced" as const, userId: owner, expiresAt };
}

// ---------------------------------------------------------------------------
// 3. En månad är betald
// ---------------------------------------------------------------------------

export type PaidInvoice = { invoiceId: string; subscriptionId: string; amountMinor: number; currency: string; paidAt: Date };

export type PaymentDeps = {
  findSubscription: (subscriptionId: string) => Promise<{ userId: string | null; refCode: string | null; commissionPercent: number } | null>;
  /** Ska inte göra något om fakturan redan finns. */
  insertPayment: (p: PaidInvoice & { userId: string | null; refCode: string | null; commissionMinor: number }) => Promise<void>;
};

/** Sparar en betald månad, med provision till partnern om kunden kom via en kod. */
export async function recordPayment(invoice: PaidInvoice, deps: PaymentDeps) {
  const sub = await deps.findSubscription(invoice.subscriptionId);
  const commission = sub?.refCode ? commissionMinor(invoice.amountMinor, sub.commissionPercent) : 0;
  await deps.insertPayment({
    ...invoice,
    userId: sub?.userId ?? null,
    refCode: sub?.refCode ?? null,
    commissionMinor: commission,
  });
  return { commissionMinor: commission };
}
