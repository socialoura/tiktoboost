const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GA_CONVERSION_LABEL = process.env.NEXT_PUBLIC_GA_CONVERSION_LABEL_PURCHASE;

/** Approximate rates to convert each currency → EUR */
const TO_EUR: Record<string, number> = {
  EUR: 1,
  USD: 0.92,
  GBP: 1.17,
  CAD: 0.68,
  AUD: 0.60,
};

interface PurchaseParams {
  value: number;
  currency: string;
  transactionId: string;
}

export function trackGoogleAdsPurchase({
  value,
  currency,
  transactionId,
}: PurchaseParams): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  if (!GA_MEASUREMENT_ID || !GA_CONVERSION_LABEL) return;

  const rate = TO_EUR[currency] ?? TO_EUR.USD;
  const eurValue = Math.round(value * rate * 100) / 100;

  window.gtag("event", "conversion", {
    send_to: `${GA_MEASUREMENT_ID}/${GA_CONVERSION_LABEL}`,
    value: eurValue,
    currency: "EUR",
    transaction_id: transactionId,
  });
}
