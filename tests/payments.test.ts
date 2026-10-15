import { describe, expect, it, vi } from "vitest";
import Stripe from "stripe";
import { accessExpiry, addMonths, commissionMinor, computePrice, normalizeRefCode } from "@/lib/payments/pricing";
import { fulfillPurchase, type FulfillDeps, type PurchaseRecord } from "@/lib/payments/fulfill";

describe("pris och rabatt", () => {
  it("fullpris utan rabatt, i öre", () => {
    expect(computePrice(149, 0)).toEqual({ listPriceMinor: 14900, amountMinor: 14900, discountMinor: 0, discountPercent: 0 });
  });

  it("rabatt avrundas till hela kronor", () => {
    expect(computePrice(149, 20).amountMinor).toBe(11900); // 119,20 → 119 kr
    expect(computePrice(149, 25).amountMinor).toBe(11200); // 111,75 → 112 kr
  });

  it("rabatten kan aldrig bli över 90 % eller under 0", () => {
    expect(computePrice(149, 150).discountPercent).toBe(90);
    expect(computePrice(149, -10).amountMinor).toBe(14900);
    expect(computePrice(149, Number.NaN).amountMinor).toBe(14900);
  });

  it("priset blir aldrig lägre än Stripes minimum på 3 kr", () => {
    expect(computePrice(5, 90).amountMinor).toBe(300);
  });

  it("provision räknas på betalt belopp", () => {
    expect(commissionMinor(11900, 30)).toBe(3570);
    expect(commissionMinor(14900, 0)).toBe(0);
  });

  it("rabattkoder från länkar normaliseras och skräp avvisas", () => {
    expect(normalizeRefCode(" AnnaTikTok ")).toBe("annatiktok");
    expect(normalizeRefCode("a")).toBeNull();
    expect(normalizeRefCode("<script>")).toBeNull();
    expect(normalizeRefCode(null)).toBeNull();
  });
});

describe("tillgångstid", () => {
  const d = (iso: string) => new Date(iso);

  it("6 månader från köpet", () => {
    expect(accessExpiry(d("2026-10-15T12:00:00Z"), null, 6).toISOString()).toBe("2027-04-15T12:00:00.000Z");
  });

  it("förlängs från nuvarande sluttid om man redan har tillgång", () => {
    expect(accessExpiry(d("2026-10-15T00:00:00Z"), d("2027-01-01T00:00:00Z"), 6).toISOString()).toBe("2027-07-01T00:00:00.000Z");
  });

  it("utgången tillgång räknas från i dag", () => {
    expect(accessExpiry(d("2026-10-15T00:00:00Z"), d("2026-01-01T00:00:00Z"), 6).toISOString()).toBe("2027-04-15T00:00:00.000Z");
  });

  it("månadsslut hanteras rätt", () => {
    expect(addMonths(d("2026-08-31T00:00:00Z"), 6).toISOString()).toBe("2027-02-28T00:00:00.000Z");
    expect(addMonths(d("2027-08-31T00:00:00Z"), 6).toISOString()).toBe("2028-02-29T00:00:00.000Z");
  });
});

// ---------- Leverans efter betalning ----------

function setup(overrides: Partial<PurchaseRecord> = {}, existingUser: string | null = null) {
  const purchase: PurchaseRecord = {
    id: "p1",
    user_id: "anon-1",
    email: "kund@example.com",
    status: "pending",
    amount_minor: 11900,
    commission_percent: 30,
    access_months: 6,
    ref_code: "anna",
    language: "ar",
    ...overrides,
  };
  const grants = new Set<string>();
  const deps: FulfillDeps = {
    now: () => new Date("2026-10-15T12:00:00Z"),
    findPurchase: vi.fn(async () => purchase),
    findUserIdByEmail: vi.fn(async () => existingUser),
    moveUserData: vi.fn(async () => {}),
    setUserEmail: vi.fn(async () => {}),
    createUser: vi.fn(async () => "new-user"),
    currentAccessExpiry: vi.fn(async () => null),
    insertAccessGrant: vi.fn(async ({ sessionId }) => {
      if (grants.has(sessionId)) return false;
      grants.add(sessionId);
      return true;
    }),
    markPaid: vi.fn(async () => {
      purchase.status = "paid";
    }),
    recordEvent: vi.fn(async () => {}),
  };
  const session = { sessionId: "cs_1", paymentStatus: "paid", email: "Kund@Example.com", paymentIntent: "pi_1", purchaseId: "p1" };
  return { purchase, deps, session };
}

describe("leverans efter betalning", () => {
  it("ger den anonyma användaren e-post och 6 månaders tillgång", async () => {
    const { deps, session } = setup();
    const r = await fulfillPurchase(session, deps);
    expect(r).toMatchObject({ status: "fulfilled", userId: "anon-1", mergedIntoExisting: false });
    expect(deps.setUserEmail).toHaveBeenCalledWith("anon-1", "kund@example.com");
    expect(deps.insertAccessGrant).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "anon-1", expiresAt: new Date("2027-04-15T12:00:00Z") }),
    );
    expect(deps.markPaid).toHaveBeenCalledWith("p1", expect.objectContaining({ commissionMinor: 3570, email: "kund@example.com" }));
  });

  it("ger inte tillgång två gånger om Stripe skickar samma händelse igen", async () => {
    const { deps, session } = setup();
    await fulfillPurchase(session, deps);
    const second = await fulfillPurchase(session, deps);
    expect(second.status).toBe("already-fulfilled");
    expect(deps.insertAccessGrant).toHaveBeenCalledTimes(1);
  });

  it("två samtidiga anrop ger bara en tillgång", async () => {
    const { deps, session } = setup();
    const [a, b] = await Promise.all([fulfillPurchase(session, deps), fulfillPurchase(session, deps)]);
    expect([a.status, b.status].sort()).toEqual(["already-fulfilled", "fulfilled"]);
    expect(deps.markPaid).toHaveBeenCalledTimes(1);
  });

  it("återkommande kund: framstegen flyttas till det befintliga kontot", async () => {
    const { deps, session } = setup({}, "existing-user");
    const r = await fulfillPurchase(session, deps);
    expect(r).toMatchObject({ status: "fulfilled", userId: "existing-user", mergedIntoExisting: true });
    expect(deps.moveUserData).toHaveBeenCalledWith("anon-1", "existing-user");
    expect(deps.setUserEmail).not.toHaveBeenCalled();
  });

  it("skapar ett konto om köpet saknar användare", async () => {
    const { deps, session } = setup({ user_id: null });
    const r = await fulfillPurchase(session, deps);
    expect(r).toMatchObject({ status: "fulfilled", userId: "new-user" });
  });

  it("gör ingenting om betalningen inte är klar", async () => {
    const { deps, session } = setup();
    const r = await fulfillPurchase({ ...session, paymentStatus: "unpaid" }, deps);
    expect(r.status).toBe("not-paid");
    expect(deps.insertAccessGrant).not.toHaveBeenCalled();
  });

  it("okänt köp ger ingen tillgång", async () => {
    const { deps, session } = setup();
    deps.findPurchase = vi.fn(async () => null);
    expect((await fulfillPurchase(session, deps)).status).toBe("unknown-purchase");
  });
});

describe("Stripes signatur på webhooks", () => {
  const stripe = new Stripe("sk_test_dummy");
  const secret = "whsec_test_hemlighet";
  const payload = JSON.stringify({ id: "evt_1", object: "event", type: "checkout.session.completed", data: { object: {} } });

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
