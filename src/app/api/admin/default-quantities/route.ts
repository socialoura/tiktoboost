import { NextRequest, NextResponse } from "next/server";
import {
  getDefaultQuantities,
  setDefaultQuantities,
  verifyAdminToken,
  extractToken,
  type DefaultQuantities,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminToken(extractToken(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const qty = await getDefaultQuantities();
    return NextResponse.json(qty);
  } catch (error) {
    console.error("[Admin Default Quantities GET]", error);
    return NextResponse.json({ error: "Failed to fetch default quantities" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminToken(extractToken(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const keys: (keyof DefaultQuantities)[] = ["followers", "likes", "views"];

    const qty: Record<string, number> = {};
    for (const key of keys) {
      const val = Number(body[key]);
      if (!Number.isFinite(val) || val < 0 || !Number.isInteger(val)) {
        return NextResponse.json(
          { error: `Invalid value for ${key}: must be a non-negative integer` },
          { status: 400 }
        );
      }
      qty[key] = val;
    }

    await setDefaultQuantities(qty as unknown as DefaultQuantities);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Default Quantities POST]", error);
    return NextResponse.json({ error: "Failed to save default quantities" }, { status: 500 });
  }
}
