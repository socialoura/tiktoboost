/* ═══════════════════════════════════════════════════════════════
   TikTok Services Pricing — Followers, Likes, Views
   Hardcoded defaults. Can be made admin-configurable later.
   ═══════════════════════════════════════════════════════════════ */

import type { ServiceTier } from "@/types/tiktok";

export interface ServiceConfig {
  key: "followers" | "likes" | "views";
  label: string;
  icon: string;       // emoji for quick display
  unit: string;       // "followers", "likes", "views"
  tiers: ServiceTier[];
}

function buildTiers(
  data: { qty: number; price: number }[],
): ServiceTier[] {
  return data.map((d) => ({
    quantity: d.qty,
    price: d.price,
    originalPrice: Math.round(d.price * 1.45 * 100) / 100,
    perUnit: Math.round((d.price / d.qty) * 10000) / 10000,
  }));
}

export const FOLLOWERS_TIERS: ServiceTier[] = buildTiers([
  { qty: 100,   price: 2.90 },
  { qty: 250,   price: 5.90 },
  { qty: 500,   price: 9.90 },
  { qty: 1000,  price: 16.90 },
  { qty: 2500,  price: 34.90 },
  { qty: 5000,  price: 64.90 },
  { qty: 10000, price: 99.90 },
  { qty: 25000, price: 175.00 },
]);

export const LIKES_TIERS: ServiceTier[] = buildTiers([
  { qty: 100,   price: 1.90 },
  { qty: 250,   price: 3.50 },
  { qty: 500,   price: 5.90 },
  { qty: 1000,  price: 9.90 },
  { qty: 2500,  price: 19.90 },
  { qty: 5000,  price: 34.90 },
  { qty: 10000, price: 59.90 },
]);

export const VIEWS_TIERS: ServiceTier[] = buildTiers([
  { qty: 500,    price: 1.50 },
  { qty: 1000,   price: 2.50 },
  { qty: 2500,   price: 4.90 },
  { qty: 5000,   price: 7.90 },
  { qty: 10000,  price: 12.90 },
  { qty: 25000,  price: 24.90 },
  { qty: 50000,  price: 39.90 },
  { qty: 100000, price: 69.90 },
]);

export const SERVICES: ServiceConfig[] = [
  {
    key: "followers",
    label: "Followers",
    icon: "👥",
    unit: "followers",
    tiers: FOLLOWERS_TIERS,
  },
  {
    key: "likes",
    label: "Likes",
    icon: "❤️",
    unit: "likes",
    tiers: LIKES_TIERS,
  },
  {
    key: "views",
    label: "Views",
    icon: "👁️",
    unit: "views",
    tiers: VIEWS_TIERS,
  },
];

/** Find the exact tier price for a quantity, or 0 if qty is 0 */
export function getTierPrice(tiers: ServiceTier[], qty: number): number {
  if (qty <= 0) return 0;
  const tier = tiers.find((t) => t.quantity === qty);
  return tier?.price ?? 0;
}

/** Format quantity for display: 1000 → "1K", 50000 → "50K" */
export function formatQty(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toString();
}
