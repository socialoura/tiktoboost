"use client";

import { useEffect, useState, useMemo, useCallback } from "react";

interface ApiTier {
  followers: string;
  price: string;
  prices?: Record<string, string>;
}

export interface ResolvedTier {
  quantity: number;
  price: number;
  originalPrice: number;
  discountPct: number;
  perUnit: number;
}

export type PlatformKey = "tiktok" | "tiktokLikes" | "tiktokViews";

/** Module-level cache so every component shares the same fetch, keyed by currency */
const cachedPricing: Record<string, Record<string, unknown>> = {};
const fetchPromises: Record<string, Promise<void>> = {};

/**
 * Progressive markup: small tiers get a small fake "original", big tiers get a large one.
 * This makes the discount % increase with quantity → nudge toward higher tiers.
 */
function progressiveMarkup(price: number, index: number, total: number): number {
  const t = total <= 1 ? 0.5 : index / (total - 1); // 0 → 1
  const multiplier = 1.2 + t * 0.6; // 1.2× for cheapest → 1.8× for most expensive
  return Math.round(price * multiplier * 100) / 100;
}

function resolveTiers(apiTiers: ApiTier[] | undefined, currency: string): ResolvedTier[] {
  if (!apiTiers || apiTiers.length === 0) return [];
  return apiTiers.map((t, i, arr) => {
    const price = parseFloat(t.prices?.[currency] ?? t.price) || 0;
    const quantity = parseInt(t.followers) || 0;
    const originalPrice = progressiveMarkup(price, i, arr.length);
    return {
      quantity,
      price,
      originalPrice,
      discountPct: originalPrice > 0 ? Math.round((1 - price / originalPrice) * 100) : 0,
      perUnit: quantity > 0 ? Math.round((price / quantity) * 10000) / 10000 : 0,
    };
  });
}

export function usePricingTiers(currency: string) {
  const cur = currency?.toUpperCase() || "EUR";
  const [apiData, setApiData] = useState<Record<string, unknown> | null>(cachedPricing[cur] ?? null);

  useEffect(() => {
    // Already cached for this currency?
    if (cachedPricing[cur]) {
      setApiData(cachedPricing[cur]);
      return;
    }
    // Fetch in progress for this currency?
    if (!fetchPromises[cur]) {
      fetchPromises[cur] = fetch(`/api/pricing?currency=${encodeURIComponent(cur)}`)
        .then((r) => r.json())
        .then((data) => {
          cachedPricing[cur] = data;
        })
        .catch(() => {});
    }
    fetchPromises[cur].then(() => {
      if (cachedPricing[cur]) setApiData(cachedPricing[cur]);
    });
  }, [cur]);

  const resolved = useMemo(() => {
    return {
      tiktok: resolveTiers(apiData?.tiktok as ApiTier[] | undefined, currency),
      tiktokLikes: resolveTiers(apiData?.tiktokLikes as ApiTier[] | undefined, currency),
      tiktokViews: resolveTiers(apiData?.tiktokViews as ApiTier[] | undefined, currency),
    };
  }, [apiData, currency]);

  const getTierPrice = useCallback(
    (platform: PlatformKey, qty: number): number => {
      if (qty <= 0) return 0;
      const tiers = resolved[platform];
      return tiers.find((t) => t.quantity === qty)?.price ?? 0;
    },
    [resolved],
  );

  const getOriginalPrice = useCallback(
    (platform: PlatformKey, qty: number): number => {
      if (qty <= 0) return 0;
      const tiers = resolved[platform];
      return tiers.find((t) => t.quantity === qty)?.originalPrice ?? 0;
    },
    [resolved],
  );

  const popularIndex = useMemo(() => {
    const pi = apiData?.popularIndex as Record<string, number> | undefined;
    return pi ?? {};
  }, [apiData]);

  return { resolved, getTierPrice, getOriginalPrice, popularIndex, loading: !apiData };
}
