/* ═══════════════════════════════════════════════════════════════
   GET /api/scraper-tiktok?username=xxx
   Returns TikTok profile info FAST (no videos).
   Videos are fetched in the background and served by
   /api/scraper-tiktok/videos?username=xxx
   ═══════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import type { TiktokProfile } from "@/types/tiktok";
import { profileCache, fetchVideosInBackground, CACHE_TTL, isRateLimited, fetchWithTimeout, RAPIDAPI_HOST, getApiKey } from "./shared";

/* ─── Search fallback: find user by keyword/nickname ─── */
async function searchTikTokByKeyword(
  keyword: string,
  headers: Record<string, string>
): Promise<{ username: string; nickname: string; avatarUrl: string } | null> {
  try {
    const res = await fetchWithTimeout(
      `https://${RAPIDAPI_HOST}/api/search/account?keyword=${encodeURIComponent(keyword)}&count=5&cursor=0`,
      { method: "GET", headers },
      10000
    );
    if (!res.ok) return null;
    const json = await res.json();

    // The new API returns { data: { user_list: [...] } } or similar structures
    const dataObj = json.data as Record<string, unknown> | undefined;
    const users: Array<Record<string, unknown>> =
      (dataObj?.user_list as Array<Record<string, unknown>>) ??
      (json.user_list as Array<Record<string, unknown>>) ??
      [];
    if (users.length === 0) return null;

    // Find a user whose nickname or uniqueId contains the keyword
    const kw = keyword.toLowerCase();
    const match = users.find((u) => {
      const info = (u.user_info ?? u.user ?? u) as Record<string, unknown>;
      const nick = String(info.nickname ?? info.nick_name ?? "").toLowerCase();
      const uid = String(info.unique_id ?? info.uniqueId ?? "").toLowerCase();
      return nick.includes(kw) || uid.includes(kw) || kw.includes(uid);
    });

    if (!match) return null;
    const info = (match.user_info ?? match.user ?? match) as Record<string, unknown>;
    const uid = String(info.unique_id ?? info.uniqueId ?? "");
    const nick = String(info.nickname ?? info.nick_name ?? "");
    const avatar = String(
      info.avatar_larger ?? info.avatarLarger ?? info.avatar_medium ?? info.avatarMedium ?? ""
    );
    if (!uid) return null;
    return {
      username: uid,
      nickname: nick,
      avatarUrl: avatar.startsWith("http")
        ? `/api/image-proxy?url=${encodeURIComponent(avatar)}`
        : avatar,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    /* Rate limit */
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    /* Validate */
    const rawUsername = req.nextUrl.searchParams.get("username")?.replace(/^@/, "").trim();
    if (!rawUsername) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }
    const username = rawUsername.toLowerCase(); // for cache keys & comparison

    /* Check cache */
    const cached = profileCache.get(username);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json(cached.data);
    }

    const apiKey = getApiKey();
    const headers = {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": RAPIDAPI_HOST,
      "Content-Type": "application/json",
    };

    /* ─── Fetch user info (fast) ─── */
    const infoRes = await fetchWithTimeout(
      `https://${RAPIDAPI_HOST}/api/user/info?uniqueId=${encodeURIComponent(rawUsername)}`,
      { method: "GET", headers },
    );

    if (!infoRes.ok) {
      const text = await infoRes.text().catch(() => "");
      if (infoRes.status === 404 || text.includes("not found")) {
        const suggestion = await searchTikTokByKeyword(username, headers);
        if (suggestion) {
          return NextResponse.json(
            { error: "We couldn't find this profile. Check the spelling or make sure the account is public.", suggestion },
            { status: 404 }
          );
        }
        return NextResponse.json({ error: "We couldn't find this profile. Check the spelling or make sure the account is public." }, { status: 404 });
      }
      throw new Error(`TikTok API ${infoRes.status}: ${text.slice(0, 200)}`);
    }

    const infoJson = await infoRes.json();

    // The new API may return 200 with a non-zero statusCode when user not found
    if (infoJson.statusCode !== 0 && infoJson.statusCode !== undefined) {
      const suggestion = await searchTikTokByKeyword(username, headers);
      if (suggestion) {
        return NextResponse.json(
          { error: "We couldn't find this profile. Check the spelling or make sure the account is public.", suggestion },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: "We couldn't find this profile. Check the spelling or make sure the account is public." }, { status: 404 });
    }

    const userInfo = infoJson.userInfo ?? infoJson;
    const user = userInfo.user ?? {};
    const stats = userInfo.stats ?? {};

    const avatarUrl =
      user.avatarLarger ?? user.avatarMedium ?? user.avatarThumb ??
      `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=18181b&color=fff&size=256&bold=true`;

    /* ─── Build profile (no posts yet) ─── */
    const profile: TiktokProfile = {
      username: user.uniqueId ?? username,
      fullName: user.nickname ?? "",
      avatarUrl: avatarUrl.startsWith("http")
        ? `/api/image-proxy?url=${encodeURIComponent(avatarUrl)}`
        : avatarUrl,
      followersCount: stats.followerCount ?? 0,
      followingCount: stats.followingCount ?? 0,
      likesCount: stats.heartCount ?? stats.heart ?? 0,
      videoCount: stats.videoCount ?? 0,
      bio: user.signature ?? "",
      verified: user.verified ?? false,
      posts: [],
    };

    /* Cache profile */
    profileCache.set(username, { data: profile, expiresAt: Date.now() + CACHE_TTL });

    /* ─── Kick off video fetch in background ─── */
    const secUid = user.secUid;
    const userId = user.id;
    if (secUid && userId) {
      fetchVideosInBackground(username, secUid, userId);
    }

    return NextResponse.json(profile);
  } catch (err) {
    console.error("[scraper-tiktok] Error:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
