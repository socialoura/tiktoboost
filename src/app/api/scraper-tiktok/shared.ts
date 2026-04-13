/* ═══════════════════════════════════════════════════════════════
   Shared utilities for TikTok scraper routes
   - Caches (profile + videos)
   - Background video fetcher
   - Rate limiter, fetch helpers
   ═══════════════════════════════════════════════════════════════ */

import type { TiktokProfile, TiktokPost } from "@/types/tiktok";

/* ─── Constants ─── */
export const CACHE_TTL = 5 * 60 * 1000;
export const RAPIDAPI_HOST = "tiktok-api23.p.rapidapi.com";

/* ─── Caches ─── */
export const profileCache = new Map<string, { data: TiktokProfile; expiresAt: number }>();
export const videosCache = new Map<string, { data: TiktokPost[]; expiresAt: number }>();

/** Track in-flight video fetches so we don't duplicate */
const videoFetchInFlight = new Map<string, Promise<TiktokPost[]>>();

/* ─── Rate limiter ─── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW = 60_000;

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

/* ─── Fetch with timeout ─── */
export async function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function getApiKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new Error("RAPIDAPI_KEY is not set");
  return key;
}

/* ─── Parse video items from API response ─── */
export function parseVideos(videosJson: Record<string, unknown>): TiktokPost[] {
  const dataObj = videosJson.data as Record<string, unknown> | undefined;
  const items: Record<string, unknown>[] =
    (dataObj?.itemList as Record<string, unknown>[]) ??
    (videosJson.itemList as Record<string, unknown>[]) ??
    (videosJson.posts as Record<string, unknown>[]) ??
    (videosJson.items as Record<string, unknown>[]) ??
    [];

  return items.slice(0, 12).map((item) => {
    const link = String(item.link ?? item.url ?? "");
    const idFromLink = link.match(/\/video\/(\d+)/)?.[1];

    const video = item.video as Record<string, unknown> | undefined;
    const statsV = item.stats as Record<string, number> | undefined;

    const imageUrl =
      (item.image as string) ??
      (video?.cover as string) ??
      (video?.dynamicCover as string) ??
      (video?.originCover as string) ??
      "";

    const likes = (item.digg as number) ?? statsV?.diggCount ?? statsV?.likeCount ?? 0;
    const comments = (item.comment as number) ?? statsV?.commentCount ?? 0;
    const views = (item.play as number) ?? statsV?.playCount ?? 0;

    return {
      id: String(item.id ?? idFromLink ?? ""),
      imageUrl: imageUrl.startsWith("http")
        ? `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`
        : imageUrl,
      caption: String((item.desc as string) ?? "").slice(0, 150),
      likesCount: likes,
      commentsCount: comments,
      viewsCount: views,
      isVideo: true,
    } satisfies TiktokPost;
  });
}

/* ─── Background video fetcher ─── */
export function fetchVideosInBackground(username: string, secUid: string, userId: string): void {
  // Already cached?
  const cached = videosCache.get(username);
  if (cached && Date.now() < cached.expiresAt) return;

  // Already in flight?
  if (videoFetchInFlight.has(username)) return;

  const promise = (async (): Promise<TiktokPost[]> => {
    try {
      const apiKey = getApiKey();
      const headers = {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": RAPIDAPI_HOST,
        "Content-Type": "application/json",
      };

      const videosRes = await fetchWithTimeout(
        `https://${RAPIDAPI_HOST}/api/user/posts?secUid=${encodeURIComponent(secUid)}&count=10&cursor=0`,
        { method: "GET", headers },
        20000,
      );

      if (!videosRes.ok) return [];
      const videosJson = await videosRes.json();
      const posts = parseVideos(videosJson);

      videosCache.set(username, { data: posts, expiresAt: Date.now() + CACHE_TTL });

      // Also update profile cache with posts
      const profileEntry = profileCache.get(username);
      if (profileEntry) {
        profileEntry.data = { ...profileEntry.data, posts };
      }

      return posts;
    } catch (err) {
      console.warn("[scraper-tiktok] Background video fetch failed:", err);
      return [];
    } finally {
      videoFetchInFlight.delete(username);
    }
  })();

  videoFetchInFlight.set(username, promise);
}

/** Wait for an in-flight video fetch, or return cached data */
export async function getVideos(username: string): Promise<TiktokPost[]> {
  // Return from cache
  const cached = videosCache.get(username);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  // Wait for in-flight fetch
  const inFlight = videoFetchInFlight.get(username);
  if (inFlight) return inFlight;

  return [];
}
