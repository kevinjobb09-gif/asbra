import type Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";
import { fulfill, getStripe, revokeRefundedPurchase, toPaidSession } from "@/lib/payments/server";

/**
 * STRIPE WEBHOOK
 * Stripe anropar den här adressen när något händer med en betalning.
 * Signaturen kontrolleras, så att ingen annan kan låtsas vara Stripe.
 *
 * Ställ in i Stripe: Developers → Webhooks → Add endpoint
 *   URL:       https://DIN-DOMÄN/api/stripe/webhook
 *   Händelser: checkout.session.completed, checkout.session.async_payment_succeeded, charge.refunded
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "Webhook är inte inställd" }, { status: 400 });

  let event: Stripe.Event;
  try {
    // Måste vara den exakta texten Stripe skickade – annars stämmer inte signaturen.
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch (e) {
    console.error("Ogiltig Stripe-signatur:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Ogiltig signatur" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const result = await fulfill(toPaidSession(event.data.object as Stripe.Checkout.Session));
        console.log(`Stripe ${event.type}: ${result.status}`);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (pi && charge.refunded) await revokeRefundedPurchase(pi);
        break;
      }
    }
  } catch (e) {
    // Svarar med fel så att Stripe försöker igen senare.
    console.error("Fel vid hantering av Stripe-händelse:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Kunde inte hantera händelsen" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
