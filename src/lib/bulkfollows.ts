import { getBFServiceIds, type BFServiceIds } from "@/lib/db";

const API_URL = "https://bulkfollows.com/api/v2";

function getApiKey(): string {
  const key = process.env.BULKFOLLOWS_API_KEY;
  if (!key) throw new Error("[BulkFollows] BULKFOLLOWS_API_KEY is not set");
  return key;
}

// Hardcoded fallbacks (used if DB is unreachable)
const DEFAULT_BF_SERVICES: BFServiceIds = {
  tiktok_followers: 14270,
  tiktok_likes: 14256,
  tiktok_views: 640,
};

// Cache service IDs for 60s to avoid hitting DB on every order
let _bfCache: { ids: BFServiceIds; ts: number } | null = null;
const BF_CACHE_TTL = 60_000;

export async function getBFServices(): Promise<BFServiceIds> {
  if (_bfCache && Date.now() - _bfCache.ts < BF_CACHE_TTL) return _bfCache.ids;
  try {
    const ids = await getBFServiceIds();
    _bfCache = { ids, ts: Date.now() };
    return ids;
  } catch {
    return DEFAULT_BF_SERVICES;
  }
}

// Keep a sync export for backward compat (fallback values only)
export const BF_SERVICES = DEFAULT_BF_SERVICES;

interface BFOrderResult {
  order?: number;
  error?: string;
}

interface BFStatusResult {
  charge?: string;
  start_count?: string;
  status?: string;
  remains?: string;
  currency?: string;
  error?: string;
}

/**
 * Place a single order on BulkFollows.
 * - followers: link = profile URL
 * - likes/views: link = video URL
 */
export async function placeOrder(params: {
  serviceId: number;
  link: string;
  quantity: number;
}): Promise<BFOrderResult> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: getApiKey(),
      action: "add",
      service: params.serviceId,
      link: params.link,
      quantity: params.quantity,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    return { error: `HTTP ${res.status}: ${res.statusText}` };
  }

  return (await res.json()) as BFOrderResult;
}

/**
 * Check order status on BulkFollows.
 */
export async function getOrderStatus(orderId: number): Promise<BFStatusResult> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: getApiKey(),
      action: "status",
      order: orderId,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    return { error: `HTTP ${res.status}: ${res.statusText}` };
  }

  return (await res.json()) as BFStatusResult;
}

/**
 * Check balance on BulkFollows.
 */
export async function getBalance(): Promise<{ balance: string; currency: string } | { error: string }> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: getApiKey(),
      action: "balance",
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    return { error: `HTTP ${res.status}: ${res.statusText}` };
  }

  return await res.json();
}

/* ─── Username verification via RapidAPI ─── */

const RAPIDAPI_HOST = "tiktok-api23.p.rapidapi.com";

/**
 * Verify that a TikTok username actually exists.
 * Returns true if the profile was found, false otherwise.
 */
export async function verifyTikTokUsername(username: string): Promise<boolean> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) {
    console.warn("[BulkFollows] RAPIDAPI_KEY not set — skipping username verification");
    return true; // fail-open: don't block orders if we can't verify
  }

  try {
    const res = await fetch(
      `https://${RAPIDAPI_HOST}/api/user/info?uniqueId=${encodeURIComponent(username)}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": RAPIDAPI_HOST,
          "x-rapidapi-key": rapidApiKey,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) return false;

    const json = await res.json();
    const data = json.data ?? json;
    const user = data?.user ?? data?.userInfo?.user;
    const uid = user?.uniqueId ?? user?.unique_id ?? "";
    return !!uid;
  } catch (err) {
    console.error("[BulkFollows] Username verification failed:", err);
    return true; // fail-open on network errors
  }
}

export interface ProviderOrder {
  type: "followers" | "likes" | "views";
  serviceId: number;
  bfOrderId: number | null;
  link: string;
  quantity: number;
  error?: string;
  status?: string;
}

/**
 * Submit all TikTok sub-orders for a ViewPlex order.
 * Returns an array of provider order results to store in DB.
 */
export async function submitTikTokOrder(params: {
  username: string;
  followersQty: number;
  likesQty: number;
  viewsQty: number;
  assignments?: {
    likes?: Array<{ postId: string; quantity: number }>;
    views?: Array<{ postId: string; quantity: number }>;
  };
}): Promise<ProviderOrder[]> {
  const svc = await getBFServices();
  const results: ProviderOrder[] = [];
  const profileUrl = `https://www.tiktok.com/@${params.username}`;

  // 1. Followers — single order to profile
  if (params.followersQty > 0) {
    try {
      const res = await placeOrder({
        serviceId: svc.tiktok_followers,
        link: profileUrl,
        quantity: params.followersQty,
      });
      results.push({
        type: "followers",
        serviceId: svc.tiktok_followers,
        bfOrderId: res.order ?? null,
        link: profileUrl,
        quantity: params.followersQty,
        error: res.error,
      });
    } catch (err) {
      results.push({
        type: "followers",
        serviceId: svc.tiktok_followers,
        bfOrderId: null,
        link: profileUrl,
        quantity: params.followersQty,
        error: String(err),
      });
    }
  }

  // 2. Likes — one order per video
  if (params.likesQty > 0 && params.assignments?.likes) {
    for (const a of params.assignments.likes) {
      const videoUrl = `https://www.tiktok.com/@${params.username}/video/${a.postId}`;
      try {
        const res = await placeOrder({
          serviceId: svc.tiktok_likes,
          link: videoUrl,
          quantity: a.quantity,
        });
        results.push({
          type: "likes",
          serviceId: svc.tiktok_likes,
          bfOrderId: res.order ?? null,
          link: videoUrl,
          quantity: a.quantity,
          error: res.error,
        });
      } catch (err) {
        results.push({
          type: "likes",
          serviceId: svc.tiktok_likes,
          bfOrderId: null,
          link: videoUrl,
          quantity: a.quantity,
          error: String(err),
        });
      }
    }
  }

  // 3. Views — one order per video
  if (params.viewsQty > 0 && params.assignments?.views) {
    for (const a of params.assignments.views) {
      const videoUrl = `https://www.tiktok.com/@${params.username}/video/${a.postId}`;
      try {
        const res = await placeOrder({
          serviceId: svc.tiktok_views,
          link: videoUrl,
          quantity: a.quantity,
        });
        results.push({
          type: "views",
          serviceId: svc.tiktok_views,
          bfOrderId: res.order ?? null,
          link: videoUrl,
          quantity: a.quantity,
          error: res.error,
        });
      } catch (err) {
        results.push({
          type: "views",
          serviceId: svc.tiktok_views,
          bfOrderId: null,
          link: videoUrl,
          quantity: a.quantity,
          error: String(err),
        });
      }
    }
  }

  return results;
}

