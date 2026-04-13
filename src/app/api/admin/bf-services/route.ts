import { NextRequest, NextResponse } from "next/server";
import {
  getBFServiceIds,
  setBFServiceIds,
  verifyAdminToken,
  extractToken,
  type BFServiceIds,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminToken(extractToken(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const ids = await getBFServiceIds();
    return NextResponse.json(ids);
  } catch (error) {
    console.error("[Admin BF Services GET]", error);
    return NextResponse.json({ error: "Failed to fetch BF service IDs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminToken(extractToken(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const keys: (keyof BFServiceIds)[] = [
      "tiktok_followers",
      "tiktok_likes",
      "tiktok_views",
    ];

    // Validate all keys are present and are positive integers
    const ids: Record<string, number> = {};
    for (const key of keys) {
      const val = Number(body[key]);
      if (!Number.isFinite(val) || val <= 0 || !Number.isInteger(val)) {
        return NextResponse.json(
          { error: `Invalid value for ${key}: must be a positive integer` },
          { status: 400 }
        );
      }
      ids[key] = val;
    }

    await setBFServiceIds(ids as unknown as BFServiceIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin BF Services POST]", error);
    return NextResponse.json({ error: "Failed to save BF service IDs" }, { status: 500 });
  }
}
