import { describe, expect, it, vi } from "vitest";
import Stripe from "stripe";
import { commissionMinor, computePrice, normalizeRefCode } from "@/lib/payments/pricing";
import { mailboxKey, normalizeWelcomeCode } from "@/lib/welcome";
import {
  accessUntil,
  handleCheckoutCompleted,
  recordPayment,
  RENEWAL_GRACE_MS,
  syncSubscription,
  type CheckoutDeps,
  type CompletedCheckout,
  type PurchaseRecord,
} from "@/lib/payments/fulfill";

describe("pris och rabatt", () => {
  it("fullpris utan rabatt, i öre", () => {
    expect(computePrice(129, 0)).toEqual({ listPriceMinor: 12900, amountMinor: 12900, discountMinor: 0, discountPercent: 0 });
  });

  it("rabatten räknas exakt på öret, som Stripes procentkupong", () => {
    expect(computePrice(129, 20).amountMinor).toBe(10320); // 103,20 kr
    expect(computePrice(129, 50).amountMinor).toBe(6450); // 64,50 kr
    expect(computePrice(129, 90).amountMinor).toBe(1290); // 12,90 kr
  });

  it("rabatten kan aldrig bli över 90 % eller under 0", () => {
    expect(computePrice(129, 150).discountPercent).toBe(90);
    expect(computePrice(129, -10).amountMinor).toBe(12900);
    expect(computePrice(129, Number.NaN).amountMinor).toBe(12900);
  });

  it("priset blir aldrig lägre än Stripes minimum på 3 kr", () => {
    expect(computePrice(5, 90).amountMinor).toBe(300);
  });

  it("varianter av samma inkorg räknas som samma person", () => {
    expect(mailboxKey("kevin+rabatt1@gmail.com")).toBe(mailboxKey("Kevin@gmail.com"));
    expect(mailboxKey("k.e.vin@googlemail.com")).toBe(mailboxKey("kevin@gmail.com"));
    expect(mailboxKey("anna+x@hotmail.com")).toBe("anna@hotmail.com");
    expect(mailboxKey("a.nna@hotmail.com")).not.toBe(mailboxKey("anna@hotmail.com"));
    expect(mailboxKey("kevin@gmail.com")).not.toBe(mailboxKey("kevin2@gmail.com"));
  });

  it("välkomstkoder normaliseras och ogiltiga koder avvisas", () => {
    expect(normalizeWelcomeCode("  VALKOMMEN-ab12cd34 ")).toBe("valkommen-ab12cd34");
    expect(normalizeWelcomeCode("ab")).toBeNull();
    expect(normalizeWelcomeCode("kod med mellanslag")).toBeNull();
    expect(normalizeWelcomeCode(null)).toBeNull();
  });

  it("provision räknas på betalt belopp", () => {
    expect(commissionMinor(12900, 30)).toBe(3870);
    expect(commissionMinor(12900, 0)).toBe(0);
  });

  it("rabattkoder från länkar normaliseras och skräp avvisas", () => {
    expect(normalizeRefCode(" AnnaTikTok ")).toBe("annatiktok");
    expect(normalizeRefCode("a")).toBeNull();
    expect(normalizeRefCode("<script>")).toBeNull();
    expect(normalizeRefCode(null)).toBeNull();
  });
});

describe("tillgång utifrån prenumerationens status", () => {
  const now = new Date("2026-10-15T12:00:00Z");
  const periodEnd = new Date("2026-11-15T12:00:00Z");

  it("aktiv prenumeration: tillgång till periodens slut + ett dygns marginal", () => {
    expect(accessUntil("active", periodEnd, now)).toEqual(new Date(periodEnd.getTime() + RENEWAL_GRACE_MS));
  });

  it("uppsagd men inte slut: fortfarande aktiv hos Stripe, alltså tillgång perioden ut", () => {
    // Stripe behåller status "active" med cancel_at_period_end = true tills perioden är slut.
    expect(accessUntil("active", periodEnd, now)).not.toBeNull();
  });

  it("misslyckad betalning (Stripe försöker igen): tillgång till periodens slut, ingen marginal", () => {
    expect(accessUntil("past_due", periodEnd, now)).toEqual(periodEnd);
    expect(accessUntil("past_due", new Date("2026-10-01T00:00:00Z"), now)).toBeNull();
  });

  it("avslutad, obetald eller aldrig startad: ingen tillgång", () => {
    for (const status of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"]) {
      expect(accessUntil(status, periodEnd, now)).toBeNull();
    }
  });
});

// ---------- Köpet är klart ----------

function setupCheckout(overrides: Partial<PurchaseRecord> = {}, existingUser: string | null = null) {
  const purchase: PurchaseRecord = {
    id: "p1",
    user_id: "anon-1",
    email: "kund@example.com",
    status: "pending",
    ref_code: "anna",
    commission_percent: 30,
    language: "ar",
    ...overrides,
  };
  const deps: CheckoutDeps = {
    now: () => new Date("2026-10-15T12:00:00Z"),
    findPurchase: vi.fn(async () => purchase),
    findUserIdByEmail: vi.fn(async () => existingUser),
    moveUserData: vi.fn(async () => {}),
    setUserEmail: vi.fn(async () => {}),
    createUser: vi.fn(async () => "new-user"),
    saveSubscriptionOwner: vi.fn(async () => {}),
    markPurchasePaid: vi.fn(async (_id, u) => {
      purchase.status = "paid";
      purchase.user_id = u.userId;
    }),
    recordEvent: vi.fn(async () => {}),
  };
  const checkout: CompletedCheckout = {
    sessionId: "cs_1",
    status: "complete",
    paymentStatus: "paid",
    email: "Kund@Example.com",
    purchaseId: "p1",
    subscriptionId: "sub_1",
    customerId: "cus_1",
  };
  return { purchase, deps, checkout };
}

describe("köpet är klart", () => {
  it("ger den anonyma användaren e-post och kopplar prenumerationen med partnerkoden", async () => {
    const { deps, checkout } = setupCheckout();
    const r = await handleCheckoutCompleted(checkout, deps);
    expect(r).toMatchObject({ status: "linked", userId: "anon-1", subscriptionId: "sub_1" });
    expect(deps.setUserEmail).toHaveBeenCalledWith("anon-1", "kund@example.com");
    expect(deps.saveSubscriptionOwner).toHaveBeenCalledWith({
      subscriptionId: "sub_1",
      customerId: "cus_1",
      userId: "anon-1",
      refCode: "anna",
      commissionPercent: 30,
    });
  });

  it("samma händelse två gånger kopplar bara en gång", async () => {
    const { deps, checkout } = setupCheckout();
    await handleCheckoutCompleted(checkout, deps);
    const second = await handleCheckoutCompleted(checkout, deps);
    expect(second.status).toBe("already-linked");
    expect(deps.saveSubscriptionOwner).toHaveBeenCalledTimes(1);
  });

  it("återkommande kund: framstegen flyttas till det befintliga kontot", async () => {
    const { deps, checkout } = setupCheckout({}, "existing-user");
    const r = await handleCheckoutCompleted(checkout, deps);
    expect(r).toMatchObject({ status: "linked", userId: "existing-user", mergedIntoExisting: true });
    expect(deps.moveUserData).toHaveBeenCalledWith("anon-1", "existing-user");
    expect(deps.setUserEmail).not.toHaveBeenCalled();
  });

  it("skapar ett konto om köpet saknar användare", async () => {
    const { deps, checkout } = setupCheckout({ user_id: null });
    expect(await handleCheckoutCompleted(checkout, deps)).toMatchObject({ status: "linked", userId: "new-user" });
  });

  it("gör ingenting om betalningen inte är klar", async () => {
    const { deps, checkout } = setupCheckout();
    expect((await handleCheckoutCompleted({ ...checkout, paymentStatus: "unpaid" }, deps)).status).toBe("not-paid");
    expect((await handleCheckoutCompleted({ ...checkout, status: "open" }, deps)).status).toBe("not-paid");
    expect(deps.saveSubscriptionOwner).not.toHaveBeenCalled();
  });

  it("okänt köp ger ingen koppling", async () => {
    const { deps, checkout } = setupCheckout();
    deps.findPurchase = vi.fn(async () => null);
    expect((await handleCheckoutCompleted(checkout, deps)).status).toBe("unknown-purchase");
  });
});

describe("prenumerationen ändras", () => {
  const base = {
    id: "sub_1",
    cancelAtPeriodEnd: false,
    periodEnd: new Date("2026-11-15T12:00:00Z"),
    startedAt: new Date("2026-10-15T12:00:00Z"),
  };
  const deps = () => ({
    now: () => new Date("2026-10-20T12:00:00Z"),
    findOwner: vi.fn(async (): Promise<string | null> => "user-1"),
    updateSubscription: vi.fn(async () => {}),
    setAccess: vi.fn(async () => {}),
  });

  it("förnyad prenumeration förlänger tillgången", async () => {
    const d = deps();
    await syncSubscription({ ...base, status: "active" }, d);
    expect(d.setAccess).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1", expiresAt: new Date(base.periodEnd.getTime() + RENEWAL_GRACE_MS) }));
  });

  it("avslutad prenumeration stänger tillgången", async () => {
    const d = deps();
    await syncSubscription({ ...base, status: "canceled" }, d);
    expect(d.setAccess).toHaveBeenCalledWith(expect.objectContaining({ expiresAt: null }));
  });

  it("okänd ägare (köpet inte kopplat än) ändrar ingenting", async () => {
    const d = deps();
    d.findOwner = vi.fn(async () => null);
    expect((await syncSubscription({ ...base, status: "active" }, d)).status).toBe("no-owner");
    expect(d.setAccess).not.toHaveBeenCalled();
  });
});

describe("betald månad", () => {
  const invoice = { invoiceId: "in_1", subscriptionId: "sub_1", amountMinor: 12900, currency: "SEK", paidAt: new Date() };

  it("provision räknas för kunder som kom via en partnerkod", async () => {
    const insertPayment = vi.fn(async () => {});
    const r = await recordPayment(invoice, {
      findSubscription: async () => ({ userId: "u1", refCode: "anna", commissionPercent: 30 }),
      insertPayment,
    });
    expect(r.commissionMinor).toBe(3870);
    expect(insertPayment).toHaveBeenCalledWith(expect.objectContaining({ refCode: "anna", commissionMinor: 3870, userId: "u1" }));
  });

  it("ingen provision utan partnerkod", async () => {
    const r = await recordPayment(invoice, {
      findSubscription: async () => ({ userId: "u1", refCode: null, commissionPercent: 30 }),
      insertPayment: async () => {},
    });
    expect(r.commissionMinor).toBe(0);
  });
});

describe("Stripes signatur på webhooks", () => {
  const stripe = new Stripe("sk_test_dummy");
  const secret = "whsec_test_hemlighet";
  const payload = JSON.stringify({ id: "evt_1", object: "event", type: "invoice.paid", data: { object: {} } });

  it("godkänner en korrekt signerad händelse", () => {
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
    expect(stripe.webhooks.constructEvent(payload, header, secret).id).toBe("evt_1");
  });

  it("avvisar en förfalskad händelse", () => {
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_fel" });
    expect(() => stripe.webhooks.constructEvent(payload, header, secret)).toThrow();
  });

  it("avvisar en ändrad händelse", () => {
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
    expect(() => stripe.webhooks.constructEvent(payload.replace("evt_1", "evt_2"), header, secret)).toThrow();
  });
});
