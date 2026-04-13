"use client";

import React, { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Users, Heart, Eye, ArrowRight, Sparkles, Lock, Clock, Shield, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePostHog } from "posthog-js/react";
import { useTiktokUpsellStore } from "@/store/useTiktokUpsellStore";
import { formatQty } from "@/config/tiktok-services";
import { formatCurrency } from "@/lib/currency";
import { useCurrency } from "@/context/CurrencyContext";
import { usePricingTiers, type ResolvedTier } from "@/hooks/usePricingTiers";
import { useTranslation } from "@/context/TranslationContext";

const TT_ACCENT = "#ee1d52";
const TT_GRADIENT = "linear-gradient(135deg, #69C9D0 0%, #ee1d52 100%)";

const BUNDLE_DISCOUNT = 0.10;

/* ─── Quick Packs ─── */
interface QuickPack {
  label: string;
  tag: string;
  followers: number;
  likes: number;
  views: number;
}
const QUICK_PACKS: QuickPack[] = [
  { label: "Starter", tag: "Great to test", followers: 500, likes: 250, views: 0 },
  { label: "Growth", tag: "Most chosen", followers: 2500, likes: 1000, views: 5000 },
  { label: "Viral", tag: "Best value", followers: 10000, likes: 5000, views: 25000 },
];

/* ─── Delivery estimate ─── */
function deliveryLabel(qty: number): string {
  if (qty <= 0) return "";
  if (qty <= 500) return "~1-2h";
  if (qty <= 2500) return "~6-12h";
  return "12-24h";
}

/* ═══════════════════════════════════════════════════════════════
   SERVICE SLIDER — one slider per service that snaps to tier values
   ═══════════════════════════════════════════════════════════════ */
interface ServiceSliderProps {
  label: string;
  icon: React.ReactNode;
  tiers: ResolvedTier[];
  selectedQty: number;
  onSelect: (qty: number) => void;
  currency: string;
  color: string;
}

function ServiceSlider({ label, icon, tiers, selectedQty, onSelect, currency, color, deliveryLabelText, noneText }: ServiceSliderProps & { deliveryLabelText: string; noneText: string }) {
  // steps = [0, tier1.qty, tier2.qty, ...]
  const steps = useMemo(() => [0, ...tiers.map((t) => t.quantity)], [tiers]);
  const currentIdx = steps.indexOf(selectedQty);
  const sliderIdx = currentIdx >= 0 ? currentIdx : 0;

  const currentTier = tiers.find((t) => t.quantity === selectedQty);
  const isActive = selectedQty > 0;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const idx = parseInt(e.target.value);
      onSelect(steps[idx] ?? 0);
    },
    [steps, onSelect],
  );

  // Filled percentage for the track
  const pct = steps.length > 1 ? (sliderIdx / (steps.length - 1)) * 100 : 0;

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all duration-300 ${
        isActive ? "border-white/[0.12]" : "border-white/[0.06] bg-white/[0.02]"
      }`}
      style={isActive ? { background: `linear-gradient(135deg, ${color}08 0%, transparent 60%)` } : undefined}
    >
      {/* Header row: icon + label | quantity + price */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
            style={{ backgroundColor: isActive ? `${color}25` : `${color}10` }}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-white">{label}</h3>
            {isActive && (
              <span className="text-[10px] text-zinc-500">{deliveryLabelText} {deliveryLabel(selectedQty)}</span>
            )}
          </div>
        </div>

        {/* Dynamic quantity + price display */}
        <div className="text-right">
          {isActive && currentTier ? (
            <>
              <p className="text-[18px] font-bold text-white leading-tight">{formatQty(selectedQty)}</p>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-[13px] font-semibold" style={{ color }}>{formatCurrency(currentTier.price, currency)}</span>
              </div>
            </>
          ) : (
            <p className="text-[14px] text-zinc-600 font-medium">{noneText}</p>
          )}
        </div>
      </div>

      {/* Slider */}
      <div className="relative px-1">
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          value={sliderIdx}
          onChange={handleChange}
          className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, rgba(255,255,255,0.06) ${pct}%, rgba(255,255,255,0.06) 100%)`,
          }}
        />
        {/* Tick marks */}
        <div className="flex justify-between mt-1.5 px-0.5">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => onSelect(s)}
              className={`text-[9px] sm:text-[10px] transition-colors ${
                i === sliderIdx ? "font-bold" : "text-zinc-600 hover:text-zinc-400"
              }`}
              style={i === sliderIdx ? { color } : undefined}
            >
              {s === 0 ? "0" : formatQty(s)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton loader ─── */
function SkeletonLoader() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 w-48 mx-auto rounded-full bg-white/[0.06]" />
      <div className="h-5 w-64 mx-auto rounded-lg bg-white/[0.04]" />
      {[1, 2, 3].map((n) => (
        <div key={n} className="rounded-2xl border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.06]" />
              <div className="h-4 w-20 rounded bg-white/[0.06]" />
            </div>
            <div className="h-5 w-16 rounded bg-white/[0.06]" />
          </div>
          <div className="h-2 rounded-full bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function BundleConfigurator() {
  const posthog = usePostHog();
  const { currency } = useCurrency();
  const {
    platform,
    profile,
    followersQty, setFollowersQty,
    likesQty, setLikesQty,
    viewsQty, setViewsQty,
    setStep,
    discountPct,
  } = useTiktokUpsellStore();

  const accent = TT_ACCENT;
  const gradient = TT_GRADIENT;

  const { t } = useTranslation();
  const { resolved, getTierPrice: getPrice, getOriginalPrice, popularIndex, loading } = usePricingTiers(currency);

  const followersTiers = resolved.tiktok;
  const likesTiers = resolved.tiktokLikes;
  const viewsTiers = resolved.tiktokViews;
  const followersPricingKey = "tiktok" as const;
  const likesPricingKey = "tiktokLikes" as const;
  const viewsPricingKey = "tiktokViews" as const;

  /* ─── Pre-select defaults on first load ─── */
  const didPreselect = useRef(false);
  useEffect(() => {
    if (loading || didPreselect.current) return;
    if (followersQty === 0 && followersTiers.length >= 2) {
      setFollowersQty(followersTiers[1].quantity);
    }
    if (likesQty === 0 && likesTiers.length >= 1) {
      setLikesQty(likesTiers[0].quantity);
    }
    if (viewsQty === 0 && viewsTiers.length >= 2) {
      setViewsQty(viewsTiers[1].quantity);
    }
    didPreselect.current = true;
  }, [loading, followersTiers]);

  /* ─── Micro-feedback state ─── */
  const [microFeedback, setMicroFeedback] = useState<string | null>(null);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const showFeedback = (msg: string) => {
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    setMicroFeedback(msg);
    feedbackTimeout.current = setTimeout(() => setMicroFeedback(null), 1800);
  };

  /* ─── Counts & pricing ─── */
  const serviceCount = (followersQty > 0 ? 1 : 0) + (likesQty > 0 ? 1 : 0) + (viewsQty > 0 ? 1 : 0);
  const hasBundleDiscount = serviceCount >= 2;

  const rawTotal = useMemo(() => {
    return (
      getPrice(followersPricingKey, followersQty) +
      getPrice(likesPricingKey, likesQty) +
      getPrice(viewsPricingKey, viewsQty)
    );
  }, [followersQty, likesQty, viewsQty, getPrice, followersPricingKey, likesPricingKey, viewsPricingKey]);

  const priceAfterBundle = hasBundleDiscount
    ? Math.round(rawTotal * (1 - BUNDLE_DISCOUNT) * 100) / 100
    : rawTotal;
  const totalPrice = discountPct > 0
    ? Math.round(priceAfterBundle * (1 - discountPct / 100) * 100) / 100
    : priceAfterBundle;

  const totalOriginal = useMemo(() => {
    return (
      getOriginalPrice(followersPricingKey, followersQty) +
      getOriginalPrice(likesPricingKey, likesQty) +
      getOriginalPrice(viewsPricingKey, viewsQty)
    );
  }, [followersQty, likesQty, viewsQty, getOriginalPrice, followersPricingKey, likesPricingKey, viewsPricingKey]);

  const totalSavings = totalOriginal > 0 ? Math.round((1 - totalPrice / totalOriginal) * 100) : 0;

  const hasSelection = followersQty > 0 || likesQty > 0 || viewsQty > 0;
  const needsLikesAssignment = likesQty > 0;
  const needsViewsAssignment = viewsQty > 0;

  /* ─── Animated total ─── */
  const prevTotal = useRef(totalPrice);
  const [displayTotal, setDisplayTotal] = useState(totalPrice);
  useEffect(() => {
    if (totalPrice === prevTotal.current) return;
    const from = prevTotal.current;
    const to = totalPrice;
    prevTotal.current = to;
    const duration = 300;
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayTotal(Math.round((from + (to - from) * eased) * 100) / 100);
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [totalPrice]);

  /* ─── Quick Pack apply ─── */
  const applyQuickPack = (pack: QuickPack) => {
    posthog?.capture("quick_pack_selected", { pack: pack.label, platform, currency });
    setFollowersQty(pack.followers);
    setLikesQty(pack.likes);
    setViewsQty(pack.views);
    showFeedback(t("pricing.packApplied", { pack: pack.label }));
  };

  /* ─── Wrapped selectors with micro-feedback ─── */
  const selectFollowers = useCallback((qty: number) => {
    setFollowersQty(qty);
    if (qty > 0) showFeedback(`${formatQty(qty)} ${t("pricing.followers")}`);
    posthog?.capture("slider_changed", { service: "followers", quantity: qty, platform, currency });
  }, [setFollowersQty, posthog, platform, t]);

  const selectLikes = useCallback((qty: number) => {
    setLikesQty(qty);
    if (qty > 0) showFeedback(`${formatQty(qty)} ${t("pricing.likes")}`);
    posthog?.capture("slider_changed", { service: "likes", quantity: qty, platform, currency });
  }, [setLikesQty, posthog, platform, t]);

  const selectViews = useCallback((qty: number) => {
    setViewsQty(qty);
    if (qty > 0) showFeedback(`${formatQty(qty)} ${t("pricing.views")}`);
    posthog?.capture("slider_changed", { service: "views", quantity: qty, platform, currency });
  }, [setViewsQty, posthog, platform, t]);

  const handleContinue = () => {
    posthog?.capture("bundle_configured", {
      platform,
      currency,
      username: profile?.username,
      followers: followersQty,
      likes: likesQty,
      views: viewsQty,
      total_price: totalPrice,
      bundle_discount: hasBundleDiscount,
      services_count: serviceCount,
    });

    document.getElementById("bundle-content")?.scrollIntoView({ behavior: "smooth", block: "start" });

    if (needsLikesAssignment) {
      setStep("assignLikes");
    } else if (needsViewsAssignment) {
      setStep("assignViews");
    } else {
      setStep("recap");
    }
  };

  /* ─── Quick Pack prices ─── */
  const packPrices = useMemo(() => {
    return QUICK_PACKS.map((p) => {
      const raw = getPrice(followersPricingKey, p.followers) + getPrice(likesPricingKey, p.likes) + getPrice(viewsPricingKey, p.views);
      const sc = (p.followers > 0 ? 1 : 0) + (p.likes > 0 ? 1 : 0) + (p.views > 0 ? 1 : 0);
      const afterBundle = sc >= 2 ? Math.round(raw * (1 - BUNDLE_DISCOUNT) * 100) / 100 : raw;
      return discountPct > 0 ? Math.round(afterBundle * (1 - discountPct / 100) * 100) / 100 : afterBundle;
    });
  }, [getPrice, followersPricingKey, likesPricingKey, viewsPricingKey, discountPct]);

  if (loading) return <SkeletonLoader />;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* ─── Bundle discount hint ─── */}
      {(
        <div className={`mb-4 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 ${
          hasBundleDiscount
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-white/[0.06] bg-white/[0.02]"
        }`}>
          {hasBundleDiscount ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[12px] font-medium text-emerald-400">{t("pricing.bundleDiscountActive", { pct: String(Math.round(BUNDLE_DISCOUNT * 100)) })}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[12px] text-zinc-500">{t("pricing.bundleDiscountHint")} <span className="font-semibold text-zinc-300">{t("pricing.bundleDiscountLabel", { pct: String(Math.round(BUNDLE_DISCOUNT * 100)) })}</span></span>
            </>
          )}
        </div>
      )}

      {/* ─── Micro feedback ─── */}
      <AnimatePresence>
        {microFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="flex justify-center mb-3"
          >
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-[11px] font-medium text-emerald-400">
              {microFeedback}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Followers packs ─── */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
              <Users className="w-4 h-4" style={{ color: accent }} />
            </div>
            <h3 className="text-[15px] font-semibold text-white">{t("pricing.followers").charAt(0).toUpperCase() + t("pricing.followers").slice(1)}</h3>
          </div>
          {followersQty > 0 && (
            <span className="text-[13px] font-bold" style={{ color: accent }}>{formatQty(followersQty)} {t("pricing.selected")}</span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {followersTiers.map((tier, idx) => {
            const isSelected = followersQty === tier.quantity;
            const rawPop = popularIndex[followersPricingKey];
            const popIdx = rawPop != null && rawPop >= 0 ? rawPop : Math.floor(followersTiers.length / 2);
            const isPopular = idx === popIdx;
            return (
              <div key={tier.quantity} className="relative">
                {isPopular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white whitespace-nowrap shadow-lg"
                    style={{ background: gradient }}
                  >
                    {t("pricing.popular")}
                  </span>
                )}
                <div
                  className="rounded-2xl p-[1px] transition-all duration-300"
                  style={isSelected ? { background: `linear-gradient(135deg, ${accent}80, ${accent}20)` } : { background: 'transparent' }}
                >
                  <button
                    onClick={() => selectFollowers(tier.quantity)}
                    className={`group relative w-full rounded-2xl px-3 py-4 text-center transition-all duration-300 ${
                      isSelected
                        ? "bg-zinc-950"
                        : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12] active:scale-[0.97]"
                    }`}
                    style={isSelected ? { boxShadow: `0 8px 40px -12px ${accent}30` } : undefined}
                  >
                    <span className={`block text-[18px] font-bold tracking-tight leading-none ${isSelected ? 'text-white' : 'text-zinc-200 group-hover:text-white'} transition-colors`}>
                      {formatQty(tier.quantity)}
                    </span>
                    <span className={`block text-[14px] font-bold mt-2 ${isSelected ? '' : 'opacity-70 group-hover:opacity-100'} transition-opacity`} style={{ color: accent }}>
                      {formatCurrency(tier.price, currency)}
                    </span>
                    <span className={`block text-[10px] mt-1.5 ${isSelected ? 'text-zinc-400' : 'text-zinc-600 group-hover:text-zinc-500'} transition-colors`}>
                      {new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'fr-FR', { style: 'currency', currency, minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(Math.round(tier.perUnit * 1000) / 1000)}{t("pricing.perFollower")}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Service sliders (Likes & Views) ─── */}
      <div className="space-y-3">
        <ServiceSlider
          label={t("pricing.likes").charAt(0).toUpperCase() + t("pricing.likes").slice(1)}
          icon={<Heart className="w-4 h-4" style={{ color: accent }} />}
          tiers={likesTiers}
          selectedQty={likesQty}
          onSelect={selectLikes}
          currency={currency}
          color={accent}
          deliveryLabelText={t("pricing.delivery")}
          noneText={t("pricing.none")}
        />
        <ServiceSlider
          label={t("pricing.views").charAt(0).toUpperCase() + t("pricing.views").slice(1)}
          deliveryLabelText={t("pricing.delivery")}
          noneText={t("pricing.none")}
          icon={<Eye className="w-4 h-4" style={{ color: accent }} />}
          tiers={viewsTiers}
          selectedQty={viewsQty}
          onSelect={selectViews}
          currency={currency}
          color={accent}
        />
      </div>

      {/* ─── Total + Continue (desktop only) ─── */}
      <div className="hidden sm:flex mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5 flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-[12px] text-zinc-500 uppercase tracking-wider font-medium">
            {t("pricing.bundleTotal")}
            {discountPct > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 animate-pulse">
                −{discountPct}% {t("pricing.applied")}
              </span>
            )}
          </p>
          <div className="flex items-baseline gap-2.5">
            <p className="text-[28px] font-bold text-white tracking-tight">
              {displayTotal > 0 ? formatCurrency(displayTotal, currency) : "\u2014"}
            </p>
            {discountPct > 0 && priceAfterBundle > 0 && displayTotal > 0 && (
              <span className="text-[14px] text-zinc-600 line-through">{formatCurrency(priceAfterBundle, currency)}</span>
            )}
            {totalOriginal > 0 && displayTotal > 0 && (
              <>
                {discountPct === 0 && <span className="text-[14px] text-zinc-600 line-through">{formatCurrency(totalOriginal, currency)}</span>}
                <span className="text-[12px] font-bold text-emerald-400">-{totalSavings}%</span>
              </>
            )}
          </div>
          {hasSelection && (
            <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500">
              {followersQty > 0 && <span>{formatQty(followersQty)} {t("pricing.followers")}</span>}
              {likesQty > 0 && <span>+ {formatQty(likesQty)} {t("pricing.likes")}</span>}
              {viewsQty > 0 && <span>+ {formatQty(viewsQty)} {t("pricing.views")}</span>}
            </div>
          )}
          {hasSelection && (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] text-zinc-600"><Shield className="w-3 h-3" /> {t("pricing.moneyBackGuarantee")}</span>
              <span className="flex items-center gap-1 text-[10px] text-zinc-600"><Clock className="w-3 h-3" /> {t("pricing.deliveryStartsMinutes")}</span>
            </div>
          )}
        </div>
        <button
          onClick={handleContinue}
          disabled={!hasSelection}
          className="shine cta-pulse w-full sm:w-auto whitespace-nowrap inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white text-[14px] font-semibold transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed disabled:animate-none"
          style={{ background: gradient }}
        >
          <Lock className="w-3.5 h-3.5" />
          {hasSelection ? `${t("pricing.secureMyBundle")} \u2014 ${formatCurrency(displayTotal, currency)}` : t("pricing.selectService")}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ─── Mobile sticky bottom bar spacer ─── */}
      <div className="sm:hidden h-[88px]" />

      {/* ─── Mobile sticky bottom bar (portalled to body) ─── */}
      {typeof document !== 'undefined' && createPortal(
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[9999] safe-area-bottom">
          <div className="relative bg-zinc-950 border-t border-white/[0.06]">
            {hasSelection && (
              <div className="absolute -top-px left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${accent}40, transparent)` }} />
            )}
            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  {hasSelection ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-[20px] font-bold text-white tracking-tight">{formatCurrency(displayTotal, currency)}</span>
                      {totalOriginal > 0 && totalSavings > 0 && (
                        <span className="text-[11px] font-semibold text-emerald-400">-{totalSavings}%</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[13px] text-zinc-500">{t("pricing.selectService")}</span>
                  )}
                  {hasSelection && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Lock className="w-2.5 h-2.5 text-zinc-600" />
                      <span className="text-[10px] text-zinc-600">{t("pricing.moneyBackGuarantee")}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleContinue}
                  disabled={!hasSelection}
                  className="shine flex-shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white text-[14px] font-bold tracking-tight transition-all active:scale-[0.96] disabled:opacity-20 disabled:cursor-not-allowed"
                  style={hasSelection ? { background: gradient, boxShadow: `0 4px 20px -4px ${accent}40` } : { backgroundColor: 'rgba(255,255,255,0.06)' }}
                >
                  {hasSelection ? (
                    <>
                      {t("pricing.continue")}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
