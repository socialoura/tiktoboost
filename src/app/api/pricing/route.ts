import { NextRequest, NextResponse } from "next/server";
import { getPricing } from "@/lib/db";
import { resolvePricingForCurrency } from "@/lib/pricing-engine";

export async function GET(req: NextRequest) {
  try {
    const pricing = await getPricing();

    // If a currency is requested, resolve all prices for that currency
    // (manual overrides take priority, auto-conversion fills the gaps)
    const currency = req.nextUrl.searchParams.get("currency")?.toUpperCase();

    if (currency) {
      const resolved = await resolvePricingForCurrency(pricing, currency);
      return NextResponse.json(resolved);
    }

    // No currency specified → return raw pricing data (backward compatible)
    return NextResponse.json(pricing);
  } catch (error) {
    console.error("[Pricing API]", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing" },
      { status: 500 }
    );
  }
}
