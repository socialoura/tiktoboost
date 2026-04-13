import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { amountToCents } from "@/lib/currency";
import { getPricing } from "@/lib/db";
import { validateCheckoutPrice } from "@/lib/pricing-engine";
import type { PricingTier } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
    });
    const { amount, platform, packageName, volume, username, email, currency = "EUR", service } =
      await req.json();

    if (!amount || !platform || !volume || !username || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const cur = (currency as string).toUpperCase();

    // ── Server-side price validation ──
    // Re-compute the expected price to prevent client tampering
    const pricingData = await getPricing();
    const platformKey = service || platform; // e.g. "tiktokLikes" or just "tiktok"
    const tiers: PricingTier[] = (pricingData as unknown as Record<string, PricingTier[]>)[platformKey] ?? pricingData.tiktok ?? [];
    const serverPrice = await validateCheckoutPrice(tiers, volume, cur);

    // Use server price as the authoritative amount
    const finalAmount = serverPrice ?? amount;

    const platformLabel = "TikTok";
    const origin = req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: cur.toLowerCase(),
            unit_amount: amountToCents(finalAmount, cur),
            product_data: {
              name: `${platformLabel} ${volume} AI Reach`,
              description: `AI-powered ${platformLabel} growth campaign for @${username}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        platform,
        packageName: packageName || `${volume} AI Reach`,
        volume,
        username,
        email,
        currency: cur,
        serverPrice: String(finalAmount),
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel?platform=${platform}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
