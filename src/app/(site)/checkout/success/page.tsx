"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

function SuccessContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [orderData, setOrderData] = useState<{
    username: string;
    email: string;
    platform: string;
    volume: string;
    price: number;
  } | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (!sessionId || processedRef.current) return;
    processedRef.current = true;

    async function processOrder() {
      try {
        // 1. Retrieve session details from our API
        const res = await fetch(`/api/verify-checkout-session?session_id=${sessionId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Session verification failed");
        }

        setOrderData({
          username: data.username,
          email: data.email,
          platform: data.platform,
          volume: data.volume,
          price: data.price,
        });

        // 2. Trigger order notifications (email, Discord, DB)
        await fetch("/api/order-success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: `VPX-${Date.now().toString(36).toUpperCase()}`,
            email: data.email,
            username: data.username,
            platform: data.platform,
            service: "AI Reach",
            quantity: data.volume,
            price: data.price,
            currency: "EUR",
          }),
        });

        setStatus("success");
      } catch (err) {
        console.error("Order processing error:", err);
        setStatus("error");
      }
    }

    processOrder();
  }, [sessionId]);

  const platformLabel = "TikTok";
  const accentColor = "#ee1d52";

  return (
    <section className="min-h-[80dvh] flex items-center justify-center bg-black px-5">
      <div className="max-w-md w-full">
        {status === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Loader2 className="w-10 h-10 text-zinc-500 animate-spin mx-auto mb-4" />
            <p className="text-[15px] text-zinc-400">{t("checkoutSuccess.confirming")}</p>
          </motion.div>
        )}

        {status === "success" && orderData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-white/[0.08] bg-zinc-950 p-8 sm:p-10 text-center"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <CheckCircle2
                className="w-8 h-8"
                style={{ color: accentColor }}
              />
            </div>

            <h1 className="text-[24px] font-semibold text-white mb-2 tracking-tight">
              {t("checkoutSuccess.title")}
            </h1>
            <p className="text-[14px] text-zinc-400 mb-1">
              {t("checkoutSuccess.campaignActive", { platform: platformLabel, volume: orderData.volume })}
            </p>
            <p className="text-[17px] font-semibold text-white mb-1">
              @{orderData.username}
            </p>
            <p className="text-[12px] text-zinc-600 mb-8">
              {t("checkoutSuccess.emailSent", { email: orderData.email })}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/${orderData.platform}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[14px] font-semibold text-white transition-colors"
                style={{ backgroundColor: accentColor }}
              >
                {t("checkoutSuccess.backTo", { platform: platformLabel })}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="flex-1 inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[14px] font-medium text-white hover:bg-white/[0.1] transition-colors"
              >
                {t("checkoutSuccess.home")}
              </Link>
            </div>
            <Link
              href={`/dashboard?email=${encodeURIComponent(orderData.email)}`}
              className="mt-4 inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              {t("checkoutSuccess.trackOrder")}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/[0.08] bg-zinc-950 p-8 sm:p-10 text-center"
          >
            <h1 className="text-[22px] font-semibold text-white mb-3">
              {t("checkoutSuccess.errorTitle")}
            </h1>
            <p className="text-[14px] text-zinc-400 mb-6">
              {t("checkoutSuccess.errorDesc")}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[14px] font-semibold text-white hover:bg-white/[0.1] transition-colors"
            >
              {t("checkoutSuccess.contactSupport")}
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-[80dvh] flex items-center justify-center bg-black">
          <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
        </section>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
