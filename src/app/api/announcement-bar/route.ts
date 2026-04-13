import { NextResponse } from "next/server";
import { getAnnouncementBarSettings } from "@/lib/db";

export async function GET() {
  try {
    const settings = await getAnnouncementBarSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to get announcement bar settings:", error);
    return NextResponse.json({ 
      enabled: true,
      text: "50% OFF on all AI Growth Packs today!",
      highlightText: "Flash Sale:",
      ctaText: "Claim offer →",
      ctaLink: "/pricing",
    });
  }
}
