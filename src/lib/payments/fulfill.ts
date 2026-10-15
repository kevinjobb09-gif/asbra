import { accessExpiry, commissionMinor } from "./pricing";

/**
 * LEVERANS EFTER BETALNING
 *
 * Anropas när Stripe säger att en betalning är klar (webhook), och som reserv
 * från tacksidan. Funktionen är "idempotent": den kan anropas flera gånger för
 * samma köp utan att ge tillgång två gånger.
 *
 * Databas och Stripe skickas in som `deps`, så att logiken kan testas utan dem.
 */

export type PurchaseRecord = {
  id: string;
  user_id: string | null;
  email: string | null;
  status: "pending" | "paid" | "refunded" | "expired";
  amount_minor: number;
  commission_percent: number;
  access_months: number;
  ref_code: string | null;
  language: string | null;
};

export type PaidSession = {
  sessionId: string;
  paymentStatus: string;
  email: string | null;
  paymentIntent: string | null;
  purchaseId: string | null;
};

export type FulfillDeps = {
  now: () => Date;
  findPurchase: (sessionId: string, purchaseId: string | null) => Promise<PurchaseRecord | null>;
  findUserIdByEmail: (email: string) => Promise<string | null>;
  moveUserData: (fromUserId: string, toUserId: string) => Promise<void>;
  /** Ger en (anonym) användare en e-postadress, så att kontot blir permanent. */
  setUserEmail: (userId: string, email: string) => Promise<void>;
  createUser: (email: string) => Promise<string>;
  currentAccessExpiry: (userId: string) => Promise<Date | null>;
  /** Ska returnera false om tillgången redan finns för sessionen (dubbelanrop). */
  insertAccessGrant: (grant: { userId: string; startsAt: Date; expiresAt: Date; sessionId: string }) => Promise<boolean>;
  markPaid: (purchaseId: string, update: { userId: string; email: string; paidAt: Date; commissionMinor: number; paymentIntent: string | null }) => Promise<void>;
  recordEvent: (purchase: PurchaseRecord) => Promise<void>;
};

export type FulfillResult =
  | { status: "fulfilled"; userId: string; expiresAt: Date; mergedIntoExisting: boolean }
  | { status: "already-fulfilled" }
  | { status: "not-paid" }
  | { status: "unknown-purchase" }
  | { status: "missing-email" };

export async function fulfillPurchase(session: PaidSession, deps: FulfillDeps): Promise<FulfillResult> {
  if (session.paymentStatus !== "paid") return { status: "not-paid" };

  const purchase = await deps.findPurchase(session.sessionId, session.purchaseId);
  if (!purchase) return { status: "unknown-purchase" };
  if (purchase.status === "paid") return { status: "already-fulfilled" };

  const email = (session.email ?? purchase.email)?.trim().toLowerCase();
  if (!email) return { status: "missing-email" };

  // Vem ska få tillgången?
  // 1. Finns redan ett konto med e-postadressen: använd det och flytta över framstegen.
  // 2. Annars: ge den anonyma användaren e-postadressen (kontot skapas vid köp).
  // 3. Ingen användare alls: skapa ett nytt konto.
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

  const now = deps.now();
  const expiresAt = accessExpiry(now, await deps.currentAccessExpiry(userId), purchase.access_months);
  const inserted = await deps.insertAccessGrant({ userId, startsAt: now, expiresAt, sessionId: session.sessionId });
  if (!inserted) return { status: "already-fulfilled" };

  await deps.markPaid(purchase.id, {
    userId,
    email,
    paidAt: now,
    commissionMinor: commissionMinor(purchase.amount_minor, purchase.commission_percent),
    paymentIntent: session.paymentIntent,
  });
  await deps.recordEvent(purchase);

  return { status: "fulfilled", userId, expiresAt, mergedIntoExisting };
}
