/* ═══════════════════════════════════════════════════════════════
   Pricing Engine — Single source of truth for all prices.

   Priority order:
     1. Manual price exists for the currency → use it
     2. Otherwise → convert from USD base price + commercial rounding

   Used by:
     - /api/pricing          (front-end reads final prices)
     - /api/create-checkout-session  (Stripe receives identical price)
     - /api/create-payment-intent    (same)
     - /api/order-success            (same price stored in DB)
   ═══════════════════════════════════════════════════════════════ */

// ─── Reference currency ────────────────────────────────────
export const BASE_CURRENCY = "EUR";

// ─── Rounding config per currency ──────────────────────────
// step = rounding granularity (always round UP to next step)
interface RoundingRule {
  step: number; // e.g. 0.10 means round up to nearest 0.10
}

const DEFAULT_ROUNDING: RoundingRule = { step: 0.10 };

/**
 * Per-currency rounding rules.
 * Override `step` for currencies where 0.10 doesn't make sense.
 */
const ROUNDING_RULES: Record<string, RoundingRule> = {
  // Zero-decimal currencies → round up to nearest 10/100 unit
  JPY: { step: 100 },
  KRW: { step: 100 },
  VND: { step: 1000 },
  HUF: { step: 10 },
  CLP: { step: 100 },
  COP: { step: 100 },
  PYG: { step: 100 },
  ISK: { step: 10 },

  // Standard currencies with 0.10 rounding
  USD: { step: 0.10 },
  EUR: { step: 0.10 },
  GBP: { step: 0.10 },
  CAD: { step: 0.10 },
  AUD: { step: 0.10 },
  CHF: { step: 0.10 },
  NZD: { step: 0.10 },
  SEK: { step: 1.00 },  // Swedish Krona: round to next whole krona
  NOK: { step: 1.00 },  // Norwegian Krone
  DKK: { step: 1.00 },  // Danish Krone
  PLN: { step: 0.10 },
  CZK: { step: 1.00 },  // Czech Koruna: round to next whole
  RON: { step: 0.10 },
  BGN: { step: 0.10 },
  TRY: { step: 0.50 },  // Turkish Lira
  BRL: { step: 0.10 },
  MXN: { step: 1.00 },  // Mexican Peso
  ZAR: { step: 1.00 },  // South African Rand
  INR: { step: 1.00 },  // Indian Rupee: round to next whole
  SGD: { step: 0.10 },
  HKD: { step: 0.10 },
  THB: { step: 1.00 },
  PHP: { step: 1.00 },
  IDR: { step: 1000 },
  MYR: { step: 0.10 },
  ILS: { step: 0.10 },
  AED: { step: 0.10 },  // UAE Dirham
  SAR: { step: 0.10 },  // Saudi Riyal
  QAR: { step: 0.10 },  // Qatari Riyal
  KWD: { step: 0.01 },  // Kuwaiti Dinar (3 decimal)
};

function getRoundingRule(currency: string): RoundingRule {
  return ROUNDING_RULES[currency.toUpperCase()] ?? DEFAULT_ROUNDING;
}

// ─── Commercial rounding ───────────────────────────────────

/**
 * Round UP to the next `step` increment.
 * Examples with step=0.10:
 *   1.82 → 1.90
 *   3.01 → 3.10
 *   3.11 → 3.20
 *   3.88 → 3.90
 *   10.01 → 10.10
 *   5.00 → 5.00 (exact → no rounding)
 */
export function applyCommercialRounding(amount: number, currency: string): number {
  const { step } = getRoundingRule(currency);
  // Math.ceil rounds up; dividing by step then multiplying gives us the next step
  const rounded = Math.ceil(amount / step) * step;
  // Fix floating point artifacts (e.g. 0.1 + 0.2 ≠ 0.3)
  const decimals = step < 1 ? Math.ceil(-Math.log10(step)) : 0;
  return parseFloat(rounded.toFixed(decimals));
}

// ─── Fallback exchange rates (USD → X) ────────────────────
// Updated periodically. These are FROM USD rates.
const FALLBACK_RATES_FROM_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.37,
  AUD: 1.55,
  CHF: 0.88,
  NZD: 1.71,
  SEK: 10.8,
  NOK: 11.0,
  DKK: 6.9,
  PLN: 4.02,
  CZK: 23.5,
  HUF: 372,
  RON: 4.65,
  BGN: 1.80,
  TRY: 34.0,
  BRL: 5.10,
  MXN: 17.2,
  ZAR: 18.5,
  INR: 83.5,
  SGD: 1.34,
  HKD: 7.82,
  THB: 35.5,
  PHP: 56.5,
  IDR: 15800,
  MYR: 4.72,
  ILS: 3.65,
  JPY: 154,
  KRW: 1350,
  VND: 25300,
  CLP: 955,
  COP: 3950,
  PYG: 7600,
  ISK: 139,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
};

// ─── Live rates with cache ─────────────────────────────────
let ratesCache: { rates: Record<string, number>; ts: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch live exchange rates FROM USD.
 * Source: Frankfurter API (free, no key needed).
 * Falls back to hardcoded rates on failure.
 */
export async function getExchangeRatesFromUSD(): Promise<Record<string, number>> {
  if (ratesCache && Date.now() - ratesCache.ts < CACHE_TTL_MS) {
    return ratesCache.rates;
  }

  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
    const data = await res.json();

    // data.rates = { EUR: 0.92, GBP: 0.79, ... } — already FROM USD
    const rates: Record<string, number> = { USD: 1.0, ...data.rates };
    ratesCache = { rates, ts: Date.now() };
    return rates;
  } catch (err) {
    console.error("[PricingEngine] Exchange rate fetch failed, using fallback:", err);
    return FALLBACK_RATES_FROM_USD;
  }
}

// ─── Core conversion ───────────────────────────────────────

/**
 * Convert a USD base price to any target currency.
 * Returns the raw converted value (before rounding).
 */
export async function convertFromUSD(amountUSD: number, toCurrency: string): Promise<number> {
  if (toCurrency === "USD") return amountUSD;
  const rates = await getExchangeRatesFromUSD();
  const rate = rates[toCurrency.toUpperCase()] ?? FALLBACK_RATES_FROM_USD[toCurrency.toUpperCase()] ?? 1;
  return amountUSD * rate;
}

/**
 * Convert + round: the main function for auto-pricing.
 */
export async function convertAndRound(amountUSD: number, toCurrency: string): Promise<number> {
  const raw = await convertFromUSD(amountUSD, toCurrency);
  return applyCommercialRounding(raw, toCurrency);
}

// ─── Final price resolver ──────────────────────────────────

export interface PricingTierInput {
  followers: string;
  price: string; // USD base price
  prices?: Record<string, string>; // Manual overrides (USD, EUR, GBP, CAD, AUD)
}

/**
 * Get the final price for a tier in a given currency.
 *
 * Priority:
 *   1. Manual price in `tier.prices[currency]` → use as-is
 *   2. Auto-convert from USD base + commercial rounding
 */
export async function getFinalTierPrice(
  tier: PricingTierInput,
  currency: string,
): Promise<number> {
  const cur = currency.toUpperCase();

  // 1. Check manual override
  const manual = tier.prices?.[cur];
  if (manual !== undefined && manual !== "") {
    const parsed = parseFloat(manual);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // 2. Auto-convert from USD
  const baseUSD = parseFloat(tier.price);
  if (isNaN(baseUSD) || baseUSD <= 0) return 0;

  return convertAndRound(baseUSD, cur);
}

/**
 * Resolve ALL tiers for a platform into final prices for a given currency.
 * Returns the same shape as the input but with an enriched `prices` map
 * that includes the target currency.
 */
export async function resolveAllTierPrices(
  tiers: PricingTierInput[],
  currency: string,
): Promise<Array<PricingTierInput & { resolvedPrice: number }>> {
  return Promise.all(
    tiers.map(async (tier) => {
      const resolvedPrice = await getFinalTierPrice(tier, currency);
      return { ...tier, resolvedPrice };
    }),
  );
}

/**
 * Resolve an entire PricingData object for a specific currency.
 * Adds a `resolvedPrices` map to the response with final prices.
 */
export async function resolvePricingForCurrency(
  pricingData: {
    tiktok: PricingTierInput[];
    tiktokLikes?: PricingTierInput[];
    tiktokViews?: PricingTierInput[];
    downsell?: { price: number; prices?: Record<string, number>; reachAmount: number; currency: string; ctaLabel: string; enabled: boolean };
    popularIndex?: Record<string, number>;
  },
  currency: string,
) {
  const cur = currency.toUpperCase();

  const resolvePlatform = async (tiers: PricingTierInput[] | undefined) => {
    if (!tiers || tiers.length === 0) return [];
    return Promise.all(
      tiers.map(async (t) => {
        const finalPrice = await getFinalTierPrice(t, cur);
        return {
          ...t,
          prices: {
            ...t.prices,
            [cur]: finalPrice.toString(),
          },
        };
      }),
    );
  };

  // Resolve downsell price
  let downsell = pricingData.downsell;
  if (downsell) {
    const manualDownsell = downsell.prices?.[cur];
    let finalDownsellPrice: number;
    if (manualDownsell !== undefined && manualDownsell > 0) {
      finalDownsellPrice = manualDownsell;
    } else {
      finalDownsellPrice = await convertAndRound(downsell.price, cur);
    }
    downsell = {
      ...downsell,
      prices: { ...downsell.prices, [cur]: finalDownsellPrice },
    };
  }

  const [tiktok, tiktokLikes, tiktokViews] = await Promise.all([
    resolvePlatform(pricingData.tiktok),
    resolvePlatform(pricingData.tiktokLikes),
    resolvePlatform(pricingData.tiktokViews),
  ]);

  return {
    tiktok,
    tiktokLikes,
    tiktokViews,
    downsell,
    popularIndex: pricingData.popularIndex,
    currency: cur,
  };
}

/**
 * Server-side price validation for checkout.
 * Given a tier quantity + platform + currency, re-compute the expected price
 * and compare it to the amount the client claims.
 * Returns the authoritative price (server truth).
 */
export async function validateCheckoutPrice(
  tiers: PricingTierInput[],
  quantity: string,
  currency: string,
): Promise<number | null> {
  const tier = tiers.find((t) => t.followers === quantity);
  if (!tier) return null;
  return getFinalTierPrice(tier, currency);
}
