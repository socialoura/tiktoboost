import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { amountToCents } from "@/lib/currency";

export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
    });
    const { amount, platform, package: pkg, username, email, currency = "EUR" } = await req.json();

    if (!amount || !platform || !pkg || !username) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountToCents(amount, currency), // Proper conversion to cents/stripe units
      currency: currency.toLowerCase(), // Stripe expects lowercase currency codes
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        platform,
        package: pkg,
        username,
        email: email || "",
        currency, // Store currency in metadata for tracking
      },
      ...(email ? { receipt_email: email } : {}),
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: "Payment intent creation failed" },
      { status: 500 }
    );
  }
}
