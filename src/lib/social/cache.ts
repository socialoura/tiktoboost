/* ═══════════════════════════════════════════════════════════════
   In-memory cache with TTL — used by /api/social-profile
   Default TTL: 15 minutes
   ═══════════════════════════════════════════════════════════════ */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/** Build a deterministic cache key */
export function profileCacheKey(platform: string, username: string): string {
  return `profile:${platform}:${username.toLowerCase()}`;
}

/** Clear all cached entries */
export function cacheClear(): void {
  store.clear();
}
