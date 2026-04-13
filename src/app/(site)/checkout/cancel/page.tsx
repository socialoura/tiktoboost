"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { XCircle, ArrowRight, Loader2 } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

function CancelContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const platform = searchParams.get("platform") || "tiktok";
  const platformLabel = "TikTok";

  return (
    <section className="min-h-[80dvh] flex items-center justify-center bg-black px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full rounded-3xl border border-white/[0.08] bg-zinc-950 p-8 sm:p-10 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-zinc-500" />
        </div>

        <h1 className="text-[22px] font-semibold text-white mb-2 tracking-tight">
          {t("checkoutCancel.title")}
        </h1>
        <p className="text-[14px] text-zinc-400 mb-8 leading-relaxed">
          {t("checkoutCancel.desc")}
          <br />
          {t("checkoutCancel.desc2")}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/${platform}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[14px] font-semibold text-white hover:bg-white/[0.1] transition-colors"
          >
            {t("checkoutCancel.backTo", { platform: platformLabel })}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[14px] font-medium text-zinc-400 hover:bg-white/[0.1] transition-colors"
          >
            {t("checkoutCancel.home")}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-[80dvh] flex items-center justify-center bg-black">
          <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
        </section>
      }
    >
      <CancelContent />
    </Suspense>
  );
}
