/* ═══════════════════════════════════════════════════════════════
   GET /api/social-profile?username=xxx&platform=tiktok
   Returns { username, photoUrl, followersCount, platform }
   - 15-min in-memory cache
   - 10 req/min per IP rate limit
   - 6s timeout on upstream
   ═══════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet, profileCacheKey } from "@/lib/social/cache";
import { fetchSocialProfile, type SocialProfile } from "@/lib/social/providers/rapidapi";

/* ─── Simple rate limiter (per IP, in-memory) ─── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

/* ─── Fallback avatar via ui-avatars.com ─── */
function fallbackProfile(username: string, platform: "tiktok"): SocialProfile {
  return {
    username,
    platform,
    photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=18181b&color=fff&size=256&bold=true`,
    followersCount: null,
  };
}

/* ─── GET handler ─── */
export async function GET(req: NextRequest) {
  try {
    /* Rate limiting */
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Try again in a minute." },
        { status: 429 },
      );
    }

    /* Validate params */
    const { searchParams } = req.nextUrl;
    const username = searchParams.get("username")?.replace(/^@/, "").trim();
    const platform = searchParams.get("platform") as "tiktok" | null;

    if (!username || !platform || platform !== "tiktok") {
      return NextResponse.json(
        { error: "Missing or invalid 'username' / 'platform' parameter." },
        { status: 400 },
      );
    }

    /* Check cache */
    const cacheKey = profileCacheKey(platform, username);
    const cached = cacheGet<SocialProfile>(cacheKey);
    if (cached) {
      return NextResponse.json(toPublicResponse(cached));
    }

    /* Fetch from RapidAPI */
    let profile: SocialProfile;
    try {
      profile = await fetchSocialProfile(username);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      
      // Silently fallback for known transient/subscription errors
      if (errMsg.includes("API_NOT_SUBSCRIBED")) {
        console.warn(`[social-profile] RapidAPI not subscribed for ${platform}, using fallback`);
      } else if (errMsg.includes("503") || errMsg.includes("502") || errMsg.includes("504") || errMsg.includes("Service Unavailable")) {
        console.warn(`[social-profile] Upstream temporarily unavailable for ${platform}/${username}, using fallback`);
      } else {
        console.error(`[social-profile] Upstream error for ${platform}/${username}:`, err);
      }
      
      profile = fallbackProfile(username, platform);
    }

    /* Cache result */
    cacheSet(cacheKey, profile);

    return NextResponse.json(toPublicResponse(profile));
  } catch (err) {
    console.error("[social-profile] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ─── Transform to public response (proxy the image URL) ─── */
function toPublicResponse(p: SocialProfile) {
  const photoUrl = p.photoUrl?.startsWith("http")
    ? `/api/image-proxy?url=${encodeURIComponent(p.photoUrl)}`
    : p.photoUrl;

  return {
    username: p.username,
    platform: p.platform,
    photoUrl,
    followersCount: p.followersCount,
  };
}
