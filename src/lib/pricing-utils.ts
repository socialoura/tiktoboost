import type { CheckoutTier } from "@/components/ui/CheckoutModal";

interface PricingTier {
  followers: string;
  price: string;
  prices?: Record<string, string>;
}

/**
 * Formats a number into a short label like "500", "1K", "2.5K", "10K", "100K"
 */
function formatLabel(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1).replace(/\.0$/, "")}K`;
  }
  return n.toString();
}

/**
 * Formats a number with commas: 1000 → "1,000", 50000 → "50,000"
 */
function formatVolume(n: number): string {
  return n.toLocaleString("en-US");
}

/**
 * Converts DB pricing tiers into CheckoutTier[] for product pages.
 * Uses the currency-specific price if available, otherwise falls back to `price` (USD).
 * originalPrice is computed as ~45% higher than price (simulating a discount).
 */
export function toCheckoutTiers(dbTiers: PricingTier[], currencyCode?: string): CheckoutTier[] {
  return dbTiers
    .filter((t) => t.followers && t.price)
    .map((t) => {
      const followers = parseInt(t.followers, 10);
      // Use currency-specific price if available, fallback to default price
      const rawPrice = (currencyCode && t.prices?.[currencyCode]) ?? t.price;
      const price = parseFloat(rawPrice);
      const originalPrice = Math.round(price * 1.45 * 100) / 100;
      return {
        label: formatLabel(followers),
        volume: formatVolume(followers),
        price,
        originalPrice,
      };
    })
    .sort((a, b) => a.price - b.price);
}
