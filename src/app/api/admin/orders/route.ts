import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, verifyAdminToken, extractToken } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminToken(extractToken(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await getAllOrders();
    return NextResponse.json(orders);
  } catch (error) {
    console.error("[Admin Orders GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
