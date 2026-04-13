import { NextRequest, NextResponse } from "next/server";
import { getAnnouncementBarSettings, setAnnouncementBarSettings, verifyAdminToken, extractToken } from "@/lib/db";
import type { AnnouncementBarSettings } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getAnnouncementBarSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to get announcement bar settings:", error);
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = extractToken(req);
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings: AnnouncementBarSettings = await req.json();
    await setAnnouncementBarSettings(settings);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save announcement bar settings:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
