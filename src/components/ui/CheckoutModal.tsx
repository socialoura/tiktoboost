"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, ExpressCheckoutElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { X, Lock, Shield, Loader2, CheckCircle2 } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { trackGoogleAdsPurchase } from "@/lib/track-google-ads";
import { formatCurrency } from "@/lib/currency";
import { useTranslation } from "@/context/TranslationContext";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
export interface CheckoutTier {
  label: string;
  volume: string;
  price: number;
  originalPrice: number;
}

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: "tiktok";
  tier: CheckoutTier;
  accentColor: string;
  accentGradient: string;
  username?: string;
  currency?: string;
  currencySymbol?: string;
  /** If true, marks this purchase as an exit-intent offer (downsell) to prevent showing it again */
  isExitIntent?: boolean;
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

/* ═══════════════════════════════════════════════════════════════
   INNER PAYMENT FORM (rendered inside <Elements>)
   ═══════════════════════════════════════════════════════════════ */
function PaymentForm({
  onCardSuccess,
  onExpressSuccess,
  onPaymentAttempted,
  accentGradient,
  accentColor,
  price,
  currency,
  email,
  onEmailError,
}: {
  onCardSuccess: () => void;
  onExpressSuccess: (paymentIntentId?: string) => void;
  onPaymentAttempted: (method: "card" | "express") => void;
  accentGradient: string;
  accentColor: string;
  price: number;
  currency?: string;
  email: string;
  onEmailError: () => void;
}) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Card / manual payment form submit - requires email
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    // Validate email for card payments
    if (!email.trim()) {
      onEmailError();
      return;
    }

    setLoading(true);
    setError(null);

    onPaymentAttempted("card");

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message || t("checkoutModal.paymentFailed"));
      setLoading(false);
    } else {
      setLoading(false);
      onCardSuccess();
    }
  };

  // Express Checkout (Apple Pay / Google Pay) confirm - email retrieved from Stripe post-payment
  const handleExpressConfirm = async () => {
    if (!stripe || !elements) return;

    onPaymentAttempted("express");

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || t("checkoutModal.paymentFailed"));
    } else {
      onExpressSuccess(paymentIntent?.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Express Checkout — Apple Pay / Google Pay big buttons */}
      <ExpressCheckoutElement
        onConfirm={handleExpressConfirm}
        options={{
          buttonHeight: 48,
          buttonType: {
            applePay: "buy",
            googlePay: "buy",
          },
        }}
      />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[11px] text-zinc-600 font-medium">{t("modal.orPayWithCard")}</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Card payment form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement
          options={{
            layout: "tabs",
            wallets: { applePay: "never", googlePay: "never" },
          }}
        />

        {error && <p className="text-red-400 text-[13px]">{error}</p>}

        <button
          type="submit"
          disabled={!stripe || loading}
          className="shine w-full py-4 rounded-2xl text-[14px] font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: accentGradient }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {t("checkoutModal.payPrice", { price: formatCurrency(price, currency || 'USD') })}
              <Lock className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHECKOUT MODAL — Single-step checkout with success confirmation
   Step 1: Username display + Email input + Payment (all in one)
   Step 2: Success
   ═══════════════════════════════════════════════════════════════ */
export default function CheckoutModal({
  isOpen,
  onClose,
  platform,
  tier,
  accentColor,
  accentGradient,
  username: prefillUsername = "",
  currency = "EUR",
  currencySymbol = "€",
  isExitIntent = false,
}: CheckoutModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [username] = useState(prefillUsername);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const { t } = useTranslation();
  const posthog = usePostHog();
  const platformLabel = "TikTok";

  // Lock body scroll when modal is open + track checkout opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      posthog?.capture("checkout_modal_opened", {
        volume: tier.volume,
        price: tier.price,
        currency,
        network: platform,
        username: prefillUsername.trim(),
        is_exit_intent: isExitIntent,
      });
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Create PaymentIntent when modal opens (with email placeholder, update on submit)
  useEffect(() => {
    if (!isOpen || clientSecret) return;
    
    const createIntent = async () => {
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: tier.price,
            platform,
            package: `${tier.volume} AI Reach`,
            username: prefillUsername.trim(),
            email: "", // Will be updated on payment
            currency,
          }),
        });

        const data = await res.json();
        if (res.ok && data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      } catch (err) {
        console.error("Failed to create payment intent:", err);
      }
    };

    createIntent();
  }, [isOpen, tier.price, tier.volume, platform, prefillUsername, currency, clientSecret]);

  const resetAndClose = useCallback(() => {
    setStep(1);
    setEmail("");
    setError(null);
    setLoading(false);
    setClientSecret(null);
    onClose();
  }, [onClose]);

  // Core payment success logic (shared between card and express checkout)
  const processPaymentSuccess = async (customerEmail: string) => {
    const orderId = `VPX-${Date.now().toString(36).toUpperCase()}`;

    posthog?.identify(customerEmail);

    posthog?.capture("payment_success", {
      volume: tier.volume,
      price: tier.price,
      currency,
      network: platform,
      email: customerEmail,
      username: username.trim(),
    });

    trackGoogleAdsPurchase({
      value: tier.price,
      currency: currency || "EUR",
      transactionId: orderId,
    });

    // Mark exit-intent offer as claimed to prevent showing it again
    // Using localStorage (client-side) - checked before showing downsell in ResultsModal
    if (isExitIntent && typeof window !== "undefined") {
      localStorage.setItem("hasClaimedExitIntent", "true");
    }

    setStep(2);

    // Fire order notifications (email, Discord, DB) in background
    try {
      await fetch("/api/order-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          email: customerEmail,
          username: username.trim(),
          platform,
          service: "AI Reach",
          quantity: tier.volume,
          price: tier.price,
          currency: currency || "EUR",
        }),
      });
    } catch (err) {
      console.error("Failed to process order notifications:", err);
    }
  };

  // Card payment success - requires email from form
  const handleCardPaymentSuccess = async () => {
    if (!email.trim()) {
      setError(t("modal.pleaseEnterEmail"));
      return;
    }
    await processPaymentSuccess(email.trim());
  };

  // Express checkout success (Apple Pay / Google Pay) - retrieve email from Stripe
  const handleExpressPaymentSuccess = async (paymentIntentId?: string) => {
    let customerEmail = email.trim();

    // If user didn't type email, retrieve it from Stripe (Apple Pay / Google Pay provides it)
    if (!customerEmail && paymentIntentId) {
      try {
        const res = await fetch("/api/retrieve-payment-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId }),
        });
        const data = await res.json();
        if (data.email) customerEmail = data.email;
      } catch (err) {
        console.error("Failed to retrieve wallet email:", err);
      }
    }

    // CRITICAL: Payment already succeeded — ALWAYS process the order.
    // If no email found, use a traceable placeholder (order still gets created + Discord notified).
    if (!customerEmail) {
      customerEmail = `wallet-${paymentIntentId || Date.now()}@applepay.pending`;
    }

    await processPaymentSuccess(customerEmail);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            onClick={resetAndClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] as const }}
            className="relative w-full max-w-[440px] mx-4 sm:mx-auto bg-zinc-950 border border-white/[0.1] rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/50 overflow-hidden max-h-[90dvh] overflow-y-auto"
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/[0.15]" />
            </div>

            {/* Close button */}
            <button
              onClick={resetAndClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* ── Header ── */}
            <div className="px-5 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-5 border-b border-white/[0.06]">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-500">
                {step === 2 ? t("modal.orderConfirmed") : t("modal.completePurchase")}
              </p>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-[28px] font-semibold text-white tracking-tight">
                  {formatCurrency(tier.price, currency || 'USD')}
                </span>
                <span className="text-[13px] text-zinc-600 line-through">
                  {formatCurrency(tier.originalPrice, currency || 'USD')}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="text-[13px] text-zinc-400">
                  {platformLabel} {tier.volume} {t("modal.followers")}
                </span>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="px-6 py-6">
              {/* ── Step 1: Single checkout step (Username + Email + Payment) ── */}
              {step === 1 && (
                <div className="space-y-5">
                  {/* Username display */}
                  {username && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                      <span className="text-[12px] font-medium text-zinc-500">{t("modal.account")}</span>
                      <span className="text-[14px] font-semibold text-white">@{username}</span>
                    </div>
                  )}

                  {/* Email input */}
                  <div>
                    <label className="block text-[12px] font-medium text-zinc-400 mb-2">
                      {t("modal.emailLabel")}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => {
                        if (email.trim()) {
                          posthog?.capture("checkout_email_entered", {
                            network: platform,
                            volume: tier.volume,
                            currency,
                          });
                        }
                      }}
                      placeholder="your@email.com"
                      required
                      className="w-full px-4 py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[16px] sm:text-[14px] text-white placeholder:text-zinc-600 focus:border-white/[0.2] focus:ring-2 focus:outline-none transition-all"
                      style={{ ["--tw-ring-color" as string]: `${accentColor}30` } as React.CSSProperties}
                    />
                  </div>

                  {error && (
                    <p className="text-red-400 text-[13px]">{error}</p>
                  )}

                  {/* Payment form (Stripe Elements) */}
                  {clientSecret ? (
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: "night",
                          variables: {
                            colorPrimary: accentColor,
                            colorBackground: "#18181b",
                            colorText: "#e4e4e7",
                            colorTextPlaceholder: "#52525b",
                            colorDanger: "#ef4444",
                            borderRadius: "12px",
                            fontFamily: "Inter, system-ui, sans-serif",
                            spacingUnit: "4px",
                          },
                          rules: {
                            ".Input": {
                              backgroundColor: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              padding: "14px 16px",
                            },
                            ".Input:focus": {
                              border: "1px solid rgba(255,255,255,0.2)",
                              boxShadow: `0 0 0 2px ${accentColor}30`,
                            },
                            ".Tab": {
                              backgroundColor: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.08)",
                            },
                            ".Tab--selected": {
                              backgroundColor: "rgba(255,255,255,0.08)",
                              border: `1px solid ${accentColor}60`,
                            },
                            ".Label": {
                              fontSize: "12px",
                              fontWeight: "500",
                            },
                          },
                        },
                      }}
                    >
                      <PaymentForm
                        onCardSuccess={handleCardPaymentSuccess}
                        onExpressSuccess={handleExpressPaymentSuccess}
                        onPaymentAttempted={(method) => {
                          posthog?.capture("checkout_payment_attempted", {
                            volume: tier.volume,
                            price: tier.price,
                            currency,
                            network: platform,
                            payment_method: method,
                            email: email.trim(),
                          });
                        }}
                        accentGradient={accentGradient}
                        accentColor={accentColor}
                        price={tier.price}
                        currency={currency}
                        email={email}
                        onEmailError={() => setError(t("modal.pleaseEnterEmail"))}
                      />
                    </Elements>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 2: Success ── */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <CheckCircle2 className="w-7 h-7" style={{ color: accentColor }} />
                  </div>
                  <h4 className="text-[20px] font-semibold text-white mb-1.5">
                    {t("modal.paymentSuccess")}
                  </h4>
                  <p className="text-[13px] text-zinc-400 mb-1">
                    {t("modal.campaignActive", { platform: platformLabel, volume: tier.volume })}
                  </p>
                  <p className="text-[15px] font-semibold text-white mb-1">
                    @{username}
                  </p>
                  <p className="text-[11px] text-zinc-600 mb-6">
                    {t("modal.confirmSent", { email })}
                  </p>
                  <button
                    onClick={resetAndClose}
                    className="px-8 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white text-[13px] font-semibold hover:bg-white/[0.1] transition-colors"
                  >
                    {t("modal.done")}
                  </button>
                </motion.div>
              )}
            </div>

            {/* ── Footer — Trust badges ── */}
            {step === 1 && (
              <div className="px-6 pb-6 pt-2">
                <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-600">
                  <Shield className="w-3 h-3" />
                  <span>{t("modal.encryptedSecure")}</span>
                  <span className="mx-1.5 text-zinc-800">·</span>
                  <img
                    src="/badges_paiement.png"
                    alt={t("checkoutModal.altPaymentMethods")}
                    className="h-4 w-auto opacity-60"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
