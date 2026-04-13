/* ═══════════════════════════════════════════════════════════════
   GET /api/scraper-tiktok/videos?username=xxx
   Returns cached videos if ready, or waits for background fetch.
   Called lazily by the frontend while user configures bundle.
   ═══════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { videosCache, getVideos, isRateLimited } from "../shared";

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const username = req.nextUrl.searchParams.get("username")?.replace(/^@/, "").trim().toLowerCase();
    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }

    const posts = await getVideos(username);
    return NextResponse.json({ posts });
  } catch (err) {
    console.error("[scraper-tiktok/videos] Error:", err);
    return NextResponse.json({ posts: [] });
  }
}
