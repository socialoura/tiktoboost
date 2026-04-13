"use client";

import { useMemo } from "react";
import { ArrowLeft, Users, Heart, Eye, Lock, ChevronRight, Shield, Clock, Sparkles } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useTiktokUpsellStore } from "@/store/useTiktokUpsellStore";
import { formatQty } from "@/config/tiktok-services";
import { formatCurrency } from "@/lib/currency";
import { useCurrency } from "@/context/CurrencyContext";
import { usePricingTiers } from "@/hooks/usePricingTiers";
import { useTranslation } from "@/context/TranslationContext";

const TT_GRADIENT = "linear-gradient(135deg, #69C9D0 0%, #ee1d52 100%)";
const BUNDLE_DISCOUNT = 0.10;


export default function OrderRecap({ onBack }: { onBack: () => void }) {
  const posthog = usePostHog();
  const { currency } = useCurrency();
  const { t } = useTranslation();
  const {
    platform,
    profile,
    followersQty,
    likesQty,
    viewsQty,
    likesAssignments,
    viewsAssignments,
    setStep,
    setCheckoutOpen,
    discountPct,
  } = useTiktokUpsellStore();

  const gradient = TT_GRADIENT;
  const followerAccent = "#ee1d52";

  const { getTierPrice: getPrice, getOriginalPrice } = usePricingTiers(currency);
  const followersPrice = getPrice("tiktok", followersQty);
  const likesPrice = getPrice("tiktokLikes", likesQty);
  const viewsPrice = getPrice("tiktokViews", viewsQty);

  const serviceCount = (followersQty > 0 ? 1 : 0) + (likesQty > 0 ? 1 : 0) + (viewsQty > 0 ? 1 : 0);
  const hasBundleDiscount = serviceCount >= 2;

  const rawTotal = useMemo(
    () => Math.round((followersPrice + likesPrice + viewsPrice) * 100) / 100,
    [followersPrice, likesPrice, viewsPrice],
  );

  const priceAfterBundle = hasBundleDiscount
    ? Math.round(rawTotal * (1 - BUNDLE_DISCOUNT) * 100) / 100
    : rawTotal;
  const totalPrice = discountPct > 0
    ? Math.round(priceAfterBundle * (1 - discountPct / 100) * 100) / 100
    : priceAfterBundle;

  const totalOriginal = useMemo(() => {
    return (
      getOriginalPrice("tiktok", followersQty) +
      getOriginalPrice("tiktokLikes", likesQty) +
      getOriginalPrice("tiktokViews", viewsQty)
    );
  }, [followersQty, likesQty, viewsQty, getOriginalPrice]);

  const totalSavings = totalOriginal > 0 ? Math.round((1 - totalPrice / totalOriginal) * 100) : 0;

  const handleCheckout = () => {
    posthog?.capture("bundle_checkout_started", {
      platform,
      currency,
      username: profile?.username,
      followers: followersQty,
      likes: likesQty,
      views: viewsQty,
      total_price: totalPrice,
      likes_videos: likesAssignments.length,
      views_videos: viewsAssignments.length,
    });
    setStep("checkout");
    setCheckoutOpen(true);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-[clamp(1.3rem,3vw,2rem)] font-semibold text-white tracking-tight">
          {t("pricing.orderSummary")}
        </h2>
        <p className="mt-2 text-[13px] text-zinc-400">
          {t("pricing.reviewBundle")} <span className="text-white font-medium">@{profile?.username}</span>
        </p>
      </div>

      {/* Profile mini card */}
      <div className="flex items-center gap-3 mb-6 p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <img
          src={profile?.avatarUrl}
          alt={profile?.username}
          className="w-12 h-12 rounded-full object-cover ring-2 ring-zinc-800"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        <div>
          <p className="text-[14px] font-semibold text-white">@{profile?.username}</p>
          <p className="text-[12px] text-zinc-500">{formatQty(profile?.followersCount ?? 0)} {t("pricing.followers")}</p>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] divide-y divide-white/[0.06] overflow-hidden">
        {/* Followers */}
        {followersQty > 0 && (
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${followerAccent}1a` }}>
                <Users className="w-4 h-4" style={{ color: followerAccent }} />
              </div>
              <div>
                <p className="text-[14px] font-medium text-white">{formatQty(followersQty)} {t("pricing.followers").charAt(0).toUpperCase() + t("pricing.followers").slice(1)}</p>
                <p className="text-[11px] text-zinc-500">{t("pricing.deliveredToProfile")}</p>
              </div>
            </div>
            <span className="text-[13px] sm:text-[15px] font-semibold text-white">{formatCurrency(followersPrice, currency)}</span>
          </div>
        )}

        {/* Likes */}
        {likesQty > 0 && (
          <div className="p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-pink-400" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-white">{formatQty(likesQty)} {t("pricing.likes").charAt(0).toUpperCase() + t("pricing.likes").slice(1)}</p>
                  <p className="text-[11px] text-zinc-500">{t("pricing.across", { count: String(likesAssignments.length), type: t("pricing.videos").slice(0, -1), s: likesAssignments.length !== 1 ? "s" : "" })}</p>
                </div>
              </div>
              <span className="text-[13px] sm:text-[15px] font-semibold text-white">{formatCurrency(likesPrice, currency)}</span>
            </div>
            {likesAssignments.length > 0 && (
              <div className="mt-3 ml-12 flex flex-wrap gap-2">
                {likesAssignments.map((a) => (
                  <div key={a.postId} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    <img src={a.imageUrl} alt="" width={24} height={32} loading="lazy" decoding="async" className="w-6 h-8 rounded object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    <span className="text-[11px] text-zinc-300">{formatQty(a.quantity)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Views */}
        {viewsQty > 0 && (
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(105,201,208,0.1)" }}>
                  <Eye className="w-4 h-4" style={{ color: "#69C9D0" }} />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-white">{formatQty(viewsQty)} {t("pricing.views").charAt(0).toUpperCase() + t("pricing.views").slice(1)}</p>
                  <p className="text-[11px] text-zinc-500">{t("pricing.across", { count: String(viewsAssignments.length), type: t("pricing.videos").slice(0, -1), s: viewsAssignments.length !== 1 ? "s" : "" })}</p>
                </div>
              </div>
              <span className="text-[13px] sm:text-[15px] font-semibold text-white">{formatCurrency(viewsPrice, currency)}</span>
            </div>
            {viewsAssignments.length > 0 && (
              <div className="mt-3 ml-12 flex flex-wrap gap-2">
                {viewsAssignments.map((a) => (
                  <div key={a.postId} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    <img src={a.imageUrl} alt="" width={24} height={32} loading="lazy" decoding="async" className="w-6 h-8 rounded object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    <span className="text-[11px] text-zinc-300">{formatQty(a.quantity)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bundle discount line */}
        {hasBundleDiscount && (
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-emerald-400">{t("pricing.bundleDiscount")}</p>
                <p className="text-[11px] text-zinc-500">{t("pricing.servicesCombined", { count: String(serviceCount) })}</p>
              </div>
            </div>
            <span className="text-[13px] sm:text-[15px] font-semibold text-emerald-400">-{formatCurrency(rawTotal - priceAfterBundle, currency)}</span>
          </div>
        )}

        {/* Post-purchase discount line */}
        {discountPct > 0 && (
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-emerald-400">{t("pricing.loyaltyDiscount")}</p>
                <p className="text-[11px] text-zinc-500">{t("pricing.loyaltyOff", { pct: String(discountPct) })}</p>
              </div>
            </div>
            <span className="text-[13px] sm:text-[15px] font-semibold text-emerald-400">-{formatCurrency(priceAfterBundle - totalPrice, currency)}</span>
          </div>
        )}

        {/* Total */}
        <div className="p-4 bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-zinc-400 uppercase tracking-wider">{t("pricing.total")}</span>
            <div className="flex items-baseline gap-2">
              {totalOriginal > 0 && (
                <span className="text-[14px] text-zinc-600 line-through">{formatCurrency(totalOriginal, currency)}</span>
              )}
              <span className="text-[18px] sm:text-[22px] font-bold text-white">{formatCurrency(totalPrice, currency)}</span>
            </div>
          </div>
          {totalSavings > 0 && (
            <p className="text-right text-[12px] font-semibold text-emerald-400 mt-1">
              {t("pricing.youSave", { pct: String(totalSavings) })}
            </p>
          )}
        </div>
      </div>

      {/* Trust signals */}
      <div className="mt-5 flex items-center justify-center gap-3 sm:gap-5 flex-wrap">
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <Shield className="w-3.5 h-3.5" /> {t("pricing.refundIfUndelivered")}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <Lock className="w-3.5 h-3.5" /> {t("pricing.stripeSecureCheckout")}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <Clock className="w-3.5 h-3.5" /> {t("pricing.delivery24_72")}
        </span>
      </div>


      {/* Navigation */}
      <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 rounded-xl text-[12px] sm:text-[13px] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {t("pricing.back")}
        </button>
        <button
          onClick={handleCheckout}
          className="shine cta-pulse inline-flex items-center justify-center gap-1.5 sm:gap-2.5 px-5 sm:px-8 py-4 rounded-2xl text-white text-[14px] sm:text-[15px] font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ background: gradient }}
        >
          <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {t("pricing.proceedToCheckout")}
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
}
