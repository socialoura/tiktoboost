import { NextRequest, NextResponse } from "next/server";
import { initDatabase, verifyAdminToken, extractToken } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminToken(extractToken(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await initDatabase();
    return NextResponse.json({ success: true, message: "Database initialized" });
  } catch (error) {
    console.error("[Init DB]", error);
    return NextResponse.json(
      { error: "Failed to initialize database" },
      { status: 500 }
    );
  }
}
