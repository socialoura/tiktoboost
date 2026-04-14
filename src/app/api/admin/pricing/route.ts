import { NextRequest, NextResponse } from "next/server";
import {
  getPricing,
  setPricing,
  getDefaultPricing,
  verifyAdminToken,
  extractToken,
} from "@/lib/db";
import type { PricingData } from "@/lib/db";

export async function GET() {
  try {
    const pricing = await getPricing();
    return NextResponse.json(pricing);
  } catch (error) {
    console.error("[Admin Pricing GET]", error);
    return NextResponse.json(getDefaultPricing());
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!verifyAdminToken(extractToken(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as PricingData;

    if (
      !body.tiktok ||
      !Array.isArray(body.tiktok)
    ) {
      return NextResponse.json(
        { error: "Invalid pricing data format" },
        { status: 400 }
      );
    }

    await setPricing(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Pricing PUT]", error);
    return NextResponse.json(
      { error: "Failed to update pricing" },
      { status: 500 }
    );
  }
}
