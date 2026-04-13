/* ═══════════════════════════════════════════════════════════════
   RapidAPI provider — fetches profile data for TikTok
   ═══════════════════════════════════════════════════════════════ */

export interface SocialProfile {
  username: string;
  platform: "tiktok";
  photoUrl: string | null;
  followersCount: number | null;
}

const TIMEOUT_MS = 10_000;
const RAPIDAPI_HOST_TT = "tiktok-scraper2.p.rapidapi.com";

function getApiKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new Error("RAPIDAPI_KEY is not set");
  return key;
}

/** Abort-safe fetch with timeout */
async function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/* ─── TikTok ─── */
export async function fetchTikTokProfile(username: string): Promise<SocialProfile> {
  const apiKey = getApiKey();

  const res = await fetchWithTimeout(
    `https://${RAPIDAPI_HOST_TT}/user/info?user_name=${encodeURIComponent(username)}`,
    {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": RAPIDAPI_HOST_TT,
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    
    // If not subscribed (403), throw specific error to trigger fallback
    if (res.status === 403 && errText.includes("not subscribed")) {
      throw new Error("API_NOT_SUBSCRIBED");
    }
    
    throw new Error(`TikTok API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const rawBody = await res.text();
  console.log("[TikTok API] Raw response:", rawBody.slice(0, 500));
  
  const json = JSON.parse(rawBody);
  
  // Response: { userInfo: { user: {...}, stats: {...} } }
  const info = json.userInfo ?? json;
  const user = info.user ?? {};
  const stats = info.stats ?? {};
  
  console.log("[TikTok API] avatarLarger:", user.avatarLarger ?? "MISSING");
  console.log("[TikTok API] followerCount:", stats.followerCount ?? "MISSING");
  console.log("[TikTok API] uniqueId:", user.uniqueId ?? "MISSING");

  // Double verification: uniqueId must match the requested username (case-insensitive)
  const returnedUsername = user.uniqueId?.toLowerCase();
  const requestedUsername = username.toLowerCase();
  
  if (!returnedUsername || returnedUsername !== requestedUsername) {
    console.log(`[TikTok API] Username mismatch: requested "${username}", got "${user.uniqueId}"`);
    // Return null values to indicate user not found
    return {
      username,
      platform: "tiktok",
      photoUrl: null,
      followersCount: null,
    };
  }

  const photoUrl: string | null =
    user.avatarLarger ?? user.avatarMedium ?? user.avatarThumb ?? null;

  const followersCount: number | null =
    stats.followerCount ?? null;

  return {
    username,
    platform: "tiktok",
    photoUrl,
    followersCount: typeof followersCount === "number" ? followersCount : null,
  };
}

/* ─── Unified entry point ─── */
export async function fetchSocialProfile(
  username: string,
): Promise<SocialProfile> {
  return fetchTikTokProfile(username);
}
