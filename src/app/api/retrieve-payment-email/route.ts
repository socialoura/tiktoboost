import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

/**
 * After a successful PaymentIntent (especially via Apple Pay / Google Pay),
 * retrieve the customer email from Stripe.
 *
 * Apple Pay and Google Pay attach the payer's email to the PaymentIntent
 * via the `latest_charge.billing_details.email` or `receipt_email`.
 */
export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
    });

    const { paymentIntentId } = await req.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Missing paymentIntentId" },
        { status: 400 }
      );
    }

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });

    // Priority: billing_details email > receipt_email > metadata email
    let email = "";

    const charge = pi.latest_charge;
    if (charge && typeof charge === "object" && "billing_details" in charge) {
      email = charge.billing_details?.email || "";
    }

    if (!email) {
      email = pi.receipt_email || "";
    }

    if (!email) {
      email = pi.metadata?.email || "";
    }

    return NextResponse.json({ email });
  } catch (error) {
    console.error("[retrieve-payment-email] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve payment email" },
      { status: 500 }
    );
  }
}
