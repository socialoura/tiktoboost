import { NextResponse } from "next/server";
import { getDefaultQuantities } from "@/lib/db";

export async function GET() {
  try {
    const qty = await getDefaultQuantities();
    return NextResponse.json(qty, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("[Default Quantities GET]", error);
    return NextResponse.json({ followers: 0, likes: 0, views: 0 });
  }
}
