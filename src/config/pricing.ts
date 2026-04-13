/* ═══════════════════════════════════════════════════════════════
   Pricing Configuration — EUR-only + Downsell
   Admin-ready structure: can be replaced by DB calls later.
   ═══════════════════════════════════════════════════════════════ */

/* ─── Currencies ─── */
export const MANUAL_CURRENCIES = ["EUR"] as const;
export type ManualCurrencyCode = (typeof MANUAL_CURRENCIES)[number];

export const ALL_CURRENCIES = ["EUR"] as const;
export type CurrencyCode = string;
export const DEFAULT_CURRENCY = "EUR";

/** Backward-compatible alias */
export const SUPPORTED_CURRENCIES = ALL_CURRENCIES;

export interface CurrencyInfo {
  code: string;
  symbol: string;
  label: string;
}

export const CURRENCY_MAP: Record<string, CurrencyInfo> = {
  EUR: { code: "EUR", symbol: "€", label: "Euro" },
};

/* ─── Downsell config ─── */
export interface DownsellConfig {
  reachAmount: number;
  price: number;
  currency: string;
  ctaLabel: string;
  enabled: boolean;
  prices?: Record<string, number>;
}

export const downsellConfig: DownsellConfig = {
  reachAmount: 100,
  price: 1.90,
  currency: "€",
  ctaLabel: "Claim My Trial Pack",
  enabled: true,
  prices: { EUR: 1.90 },
};

/* ─── Social proof names for rotating notifications ─── */
export const SOCIAL_PROOF_NAMES = [
  "Alex", "Sarah", "Mike", "Emma", "Lucas", "Olivia",
  "Noah", "Sophia", "Liam", "Isabella", "James", "Mia",
  "Ethan", "Ava", "Daniel", "Charlotte", "Mason", "Amelia",
  "Logan", "Harper", "Léa", "Théo", "Jade", "Hugo",
];
