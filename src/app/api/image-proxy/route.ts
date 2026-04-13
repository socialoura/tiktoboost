/* ═══════════════════════════════════════════════════════════════
   GET /api/image-proxy?url=<encoded_url>
   Proxies external images to bypass CDN CORS / 403 restrictions.
   Returns the raw image bytes with correct content-type headers.
   ═══════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";

const TIMEOUT_MS = 8_000;
const ALLOWED_HOSTS = [
  "tiktokcdn",
  "tiktok",
  "p16-sign",
  "p16-amd",
  "p77-sign",
  "muscdn",
  "ui-avatars.com",
];

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
  }

  /* Validate URL origin to avoid open-proxy abuse */
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const isAllowed = ALLOWED_HOSTS.some((h) => parsed.hostname.includes(h));
  if (!isAllowed) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const upstream = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        Referer: parsed.origin + "/",
      },
    });

    clearTimeout(timer);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: 502 },
      );
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("[image-proxy]", err);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
}
