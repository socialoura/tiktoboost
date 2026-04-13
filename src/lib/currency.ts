/**
 * Currency formatting utilities using Intl.NumberFormat
 * Handles proper symbol placement, decimal separators, and locale-specific formatting
 */

export function formatCurrency(amount: number, currencyCode: string = 'EUR'): string {
  // Ensure amount is a valid number
  const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  
  // Create formatter with proper locale for each currency
  const locale = getLocaleForCurrency(currencyCode);
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: getMinimumFractionDigits(currencyCode),
    maximumFractionDigits: getMaximumFractionDigits(currencyCode),
  }).format(validAmount);
}

/**
 * Get the appropriate locale for a currency to ensure correct symbol placement
 */
function getLocaleForCurrency(currencyCode: string): string {
  const localeMap: Record<string, string> = {
    'USD': 'en-US',
    'EUR': 'de-DE', // German locale uses comma as decimal separator and places € after amount
    'GBP': 'en-GB',
    'CAD': 'en-CA',
    'AUD': 'en-AU',
    'CHF': 'de-CH',
    'JPY': 'ja-JP',
    'CNY': 'zh-CN',
    'SEK': 'sv-SE',
    'NOK': 'nb-NO',
    'DKK': 'da-DK',
    'PLN': 'pl-PL',
    'CZK': 'cs-CZ',
    'HUF': 'hu-HU',
    'RON': 'ro-RO',
    'BGN': 'bg-BG',
    'HRK': 'hr-HR',
    'RUB': 'ru-RU',
    'TRY': 'tr-TR',
    'ILS': 'he-IL',
    'THB': 'th-TH',
    'SGD': 'en-SG',
    'HKD': 'en-HK',
    'NZD': 'en-NZ',
    'ZAR': 'en-ZA',
    'MXN': 'es-MX',
    'BRL': 'pt-BR',
    'ARS': 'es-AR',
    'CLP': 'es-CL',
    'COP': 'es-CO',
    'PEN': 'es-PE',
    'UYU': 'es-UY',
    'KRW': 'ko-KR',
    'INR': 'en-IN',
    'MYR': 'en-MY',
    'PHP': 'en-PH',
    'IDR': 'en-ID',
    'VND': 'vi-VN',
  };
  
  return localeMap[currencyCode] || 'en-US';
}

/**
 * Get minimum fraction digits for a currency
 */
function getMinimumFractionDigits(currencyCode: string): number {
  // These currencies typically don't show decimal places
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'COP', 'UYU', 'PYG', 'HUF', 'ISK'];
  return zeroDecimalCurrencies.includes(currencyCode) ? 0 : 2;
}

/**
 * Get maximum fraction digits for a currency
 */
function getMaximumFractionDigits(currencyCode: string): number {
  // These currencies typically don't show decimal places
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'COP', 'UYU', 'PYG', 'HUF', 'ISK'];
  return zeroDecimalCurrencies.includes(currencyCode) ? 0 : 2;
}

/**
 * Convert amount in cents/stripe units to decimal amount for display
 */
export function centsToAmount(cents: number, currencyCode: string = 'EUR'): number {
  const divisor = getMinimumFractionDigits(currencyCode) === 0 ? 1 : 100;
  return cents / divisor;
}

/**
 * Convert decimal amount to cents/stripe units
 */
export function amountToCents(amount: number, currencyCode: string = 'EUR'): number {
  const multiplier = getMinimumFractionDigits(currencyCode) === 0 ? 1 : 100;
  return Math.round(amount * multiplier);
}

/**
 * Get currency symbol for display (fallback)
 */
export function getCurrencySymbol(currencyCode: string): string {
  try {
    return (0).toLocaleString(getLocaleForCurrency(currencyCode), {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).replace(/[0-9\s]/g, '');
  } catch {
    return currencyCode;
  }
}

// ─── Currency Conversion (Server-side only) ───────────────────────────────

// Fallback rates to EUR (updated periodically)
const FALLBACK_RATES_TO_EUR: Record<string, number> = {
  USD: 0.92,
  EUR: 1.0,
  GBP: 1.17,
  CAD: 0.68,
  AUD: 0.60,
  CHF: 1.05,
  JPY: 0.0061,
  CNY: 0.13,
  SEK: 0.087,
  NOK: 0.085,
  DKK: 0.13,
  PLN: 0.23,
  CZK: 0.040,
  HUF: 0.0025,
  RON: 0.20,
  BGN: 0.51,
  TRY: 0.028,
  ILS: 0.25,
  THB: 0.026,
  SGD: 0.69,
  HKD: 0.12,
  NZD: 0.56,
  ZAR: 0.050,
  MXN: 0.054,
  BRL: 0.18,
  INR: 0.011,
  KRW: 0.00068,
};

// Cache for exchange rates (1 hour TTL)
let ratesCache: { rates: Record<string, number>; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Fetch exchange rates from Frankfurter API (free, no API key)
 * Returns rates relative to EUR (base)
 */
async function fetchExchangeRates(): Promise<Record<string, number>> {
  // Check cache first
  if (ratesCache && Date.now() - ratesCache.timestamp < CACHE_TTL) {
    return ratesCache.rates;
  }

  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=EUR', {
      next: { revalidate: 3600 }, // Cache for 1 hour in Next.js
    });
    
    if (!response.ok) {
      throw new Error(`Frankfurter API error: ${response.status}`);
    }
    
    const data = await response.json();
    // Frankfurter returns rates FROM EUR, we need TO EUR
    // So we invert: 1 USD = X EUR means rate = 1/X
    const ratesToEur: Record<string, number> = { EUR: 1 };
    for (const [currency, rate] of Object.entries(data.rates)) {
      ratesToEur[currency] = 1 / (rate as number);
    }
    
    // Update cache
    ratesCache = { rates: ratesToEur, timestamp: Date.now() };
    return ratesToEur;
  } catch (error) {
    console.error('[Currency] Failed to fetch exchange rates, using fallback:', error);
    return FALLBACK_RATES_TO_EUR;
  }
}

/**
 * Convert an amount from any currency to EUR
 * @param amount - Amount in original currency
 * @param fromCurrency - Original currency code (e.g., 'USD', 'GBP')
 * @returns Amount in EUR
 */
export async function convertToEur(amount: number, fromCurrency: string): Promise<number> {
  if (fromCurrency === 'EUR') return amount;
  
  const rates = await fetchExchangeRates();
  const rate = rates[fromCurrency.toUpperCase()] || FALLBACK_RATES_TO_EUR[fromCurrency.toUpperCase()] || 1;
  return amount * rate;
}

/**
 * Convert multiple amounts to EUR and sum them
 * @param items - Array of { amount, currency } objects
 * @returns Total in EUR
 */
export async function convertAndSumToEur(items: Array<{ amount: number; currency: string }>): Promise<number> {
  const rates = await fetchExchangeRates();
  
  let total = 0;
  for (const item of items) {
    if (item.currency === 'EUR') {
      total += item.amount;
    } else {
      const rate = rates[item.currency.toUpperCase()] || FALLBACK_RATES_TO_EUR[item.currency.toUpperCase()] || 1;
      total += item.amount * rate;
    }
  }
  
  return Math.round(total * 100) / 100; // Round to 2 decimals
}
