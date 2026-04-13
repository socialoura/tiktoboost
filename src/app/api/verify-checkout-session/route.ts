import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
    });
    const sessionId = req.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed", success: false },
        { status: 400 }
      );
    }

    const metadata = session.metadata || {};

    return NextResponse.json({
      success: true,
      username: metadata.username || "",
      email: metadata.email || "",
      platform: metadata.platform || "tiktok",
      volume: metadata.volume || "",
      packageName: metadata.packageName || "",
      price: (session.amount_total || 0) / 100,
    });
  } catch (error) {
    console.error("Session verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify session", success: false },
      { status: 500 }
    );
  }
}
