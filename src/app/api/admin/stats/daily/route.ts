import { NextRequest, NextResponse } from "next/server";
import { getStatsByDate, verifyAdminToken, extractToken } from "@/lib/db";
import { convertAndSumToEur } from "@/lib/currency";

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminToken(extractToken(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get date from query params, default to today
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const date = dateParam || new Date().toISOString().split("T")[0];

    const stats = await getStatsByDate(date);

    // Convert total revenue to EUR
    const totalRevenueEur = await convertAndSumToEur(stats.totalRevenueItems);

    // Calculate AOV (Average Order Value) in EUR
    const aovEur = stats.uniqueCustomers > 0 
      ? Math.round((totalRevenueEur / stats.uniqueCustomers) * 100) / 100
      : 0;

    return NextResponse.json({
      date,
      totalOrders: stats.totalOrders,
      totalRevenueEur,
      uniqueCustomers: stats.uniqueCustomers,
      exitIntentPurchases: stats.exitIntentPurchases,
      aovEur,
      byCurrency: stats.byCurrency,
    });
  } catch (error) {
    console.error("[Admin Daily Stats]", error);
    return NextResponse.json(
      { error: "Failed to fetch daily stats" },
      { status: 500 }
    );
  }
}
