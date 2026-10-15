import type Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";
import { getStripe, processCheckoutSession, processInvoicePaid, processSubscription } from "@/lib/payments/server";

/**
 * STRIPE WEBHOOK
 * Stripe anropar den här adressen när något händer med en prenumeration.
 * Signaturen kontrolleras, så att ingen annan kan låtsas vara Stripe.
 *
 * Ställ in i Stripe: Developers → Webhooks → Add endpoint
 *   URL:       https://DIN-DOMÄN/api/stripe/webhook
 *   Händelser: checkout.session.completed, invoice.paid,
 *              customer.subscription.updated, customer.subscription.deleted
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
      case "checkout.session.completed": {
        const result = await processCheckoutSession(event.data.object as Stripe.Checkout.Session);
        console.log(`Stripe ${event.type}: ${result.status}`);
        break;
      }
      case "invoice.paid": {
        const result = await processInvoicePaid(event.data.object as Stripe.Invoice);
        console.log(`Stripe ${event.type}: ${result.status}`);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const result = await processSubscription(event.data.object as Stripe.Subscription);
        console.log(`Stripe ${event.type}: ${result.status}`);
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
