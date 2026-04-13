"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Shield,
  Zap,
  Search,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Star,
  Users,
  Heart,
  Eye,
  Clock,
  CheckCircle2,
  ArrowRight,
  Play,
  BarChart3,
  Globe,
  Lock,
  Check,
} from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useCurrency } from "@/context/CurrencyContext";
import { useTiktokUpsellStore } from "@/store/useTiktokUpsellStore";
import { usePricingTiers } from "@/hooks/usePricingTiers";
import { formatCurrency } from "@/lib/currency";
import { formatQty } from "@/config/tiktok-services";
import ProfileSearchInput from "@/components/tiktok-upsell/ProfileSearchInput";
import ProfileCard from "@/components/tiktok-upsell/ProfileCard";
import BundleConfigurator from "@/components/tiktok-upsell/BundleConfigurator";
import VideoSelector from "@/components/tiktok-upsell/VideoSelector";
import OrderRecap from "@/components/tiktok-upsell/OrderRecap";
import BundleCheckoutModal from "@/components/tiktok-upsell/BundleCheckoutModal";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useTranslation } from "@/context/TranslationContext";

/* ─── TikTok Icon ─── */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16.6 5.82A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
    </svg>
  );
}


/* ─── Constants ─── */
const TT_ACCENT = "#ee1d52";
const TT_GRADIENT = "linear-gradient(135deg, #69C9D0 0%, #ee1d52 100%)";

/* ─── Review Data ─── */
const REVIEW_AUTHORS = [
  { name: "Léa",     img: "/reviews/user1.webp", key: "reviews.r1" },
  { name: "Julien",  img: "/reviews/user2.webp", key: "reviews.r2" },
  { name: "Chloé",   img: "/reviews/user3.webp", key: "reviews.r3" },
  { name: "Lucas",   img: "/reviews/user4.webp", key: "reviews.r4" },
  { name: "Camille", img: "/reviews/user5.webp", key: "reviews.r5" },
  { name: "Antoine", img: "/reviews/user6.webp", key: "reviews.r6" },
];

function HeroReviews() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center">
      <div className="flex items-center -space-x-2.5">
        {REVIEW_AUTHORS.map((r, i) => (
          <div key={r.name} className="group relative" style={{ zIndex: REVIEW_AUTHORS.length - i }}>
            <Image
              src={r.img}
              alt={r.name}
              width={40}
              height={40}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-[2.5px] ring-black cursor-pointer transition-transform duration-200 group-hover:scale-110 group-hover:!z-50"
            />
          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50">
            <div className="bg-zinc-900 border border-white/[0.08] rounded-xl p-4 shadow-2xl shadow-black/60">
              <Image src="/reviews/stars.svg" alt="5 stars" width={80} height={16} className="h-3.5 w-auto mb-2" />
              <p className="text-[12px] text-zinc-300 leading-relaxed mb-3">{t(r.key)}</p>
              <div className="flex items-center gap-2">
                <Image src={r.img} alt={r.name} width={20} height={20} className="w-5 h-5 rounded-full object-cover" />
                <span className="text-[11px] font-semibold text-white">{r.name}</span>
                <span className="text-[10px] text-zinc-600">{t("reviews.verifiedBuyer")}</span>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-2.5 h-2.5 bg-zinc-900 border-r border-b border-white/[0.08] rotate-45 -mt-[5px]" />
            </div>
          </div>
          </div>
        ))}
      </div>
      <div className="ml-3 flex flex-col">
        <Image src="/reviews/stars.svg" alt="5 stars" width={88} height={18} className="h-[18px] w-auto" />
        <span className="text-[11px] text-zinc-500 font-medium mt-0.5">4.9/5 (2,847+)</span>
      </div>
    </div>
  );
}

/* ─── Animated counter ─── */
function AnimCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

/* ─── Live Delivery Ticker ─── */
const TICKER_ITEMS = [
  { qty: "5,000", type: "views", ago: 13 },
  { qty: "300", type: "followers", ago: 21 },
  { qty: "1,000", type: "likes", ago: 6 },
  { qty: "5,000", type: "followers", ago: 32 },
  { qty: "500", type: "followers", ago: 5 },
  { qty: "1,000", type: "followers", ago: 16 },
  { qty: "250", type: "likes", ago: 3 },
  { qty: "100", type: "followers", ago: 20 },
];

function LiveDeliveryTicker() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % TICKER_ITEMS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const typeLabel = (type: string) => {
    if (type === "followers") return t("pricing.followers");
    if (type === "likes") return t("pricing.likes");
    return t("pricing.views");
  };

  return (
    <div className="px-3 sm:px-4 h-[54px] overflow-hidden rounded-xl w-full max-w-[300px] sm:max-w-[330px] md:w-[360px] md:max-w-[360px] flex items-center space-x-2 bg-emerald-500/[0.08] border border-emerald-500/20">
      <div
        className="w-full h-full"
        style={{ transition: "transform 0.5s ease", transform: `translateY(-${index * 54}px)` }}
      >
        {TICKER_ITEMS.map((item, i) => (
          <div key={i} className="text-sm h-[54px] font-medium items-center flex w-full">
            <span className="relative flex mr-2 h-2.5 w-2.5 flex-shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            <div className="flex items-center justify-between w-full font-normal text-[13px] md:text-sm text-emerald-300">
              <div className="text-nowrap">
                <span className="font-semibold text-emerald-200">{item.qty} {typeLabel(item.type)}</span>{" "}
                <span>{t("pricing.tickerDelivered")}</span>
              </div>
              <div className="ml-auto flex items-center space-x-1.5">
                <div className="rounded-full w-[19px] h-[19px] p-[3px] bg-white/10 shadow-md">
                  <Check className="w-full h-full text-green-400" strokeWidth={4.5} />
                </div>
                <div className="text-emerald-400/70 text-[12px]">{item.ago} min</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── FAQ Accordion Item ─── */
function FAQRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const posthog = usePostHog();
  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button
        onClick={() => {
          if (!open) posthog?.capture("faq_clicked", { question: q, variant: "homepage" });
          setOpen(!open);
        }}
        className="flex items-center justify-between w-full py-5 text-left gap-4"
      >
        <span className="text-[14px] font-medium text-white">{q}</span>
        <ChevronDown className={`w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-[13px] text-zinc-400 leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

/* ─── Compact step badge ─── */
function StepBadge({ number, label, active, done }: { number: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
          active
            ? "bg-white text-black"
            : done
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-white/[0.05] text-zinc-600 border border-white/[0.08]"
        }`}
      >
        {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : number}
      </div>
      <span className={`text-[12px] font-medium hidden sm:inline ${active ? "text-white" : done ? "text-emerald-400" : "text-zinc-600"}`}>
        {label}
      </span>
    </div>
  );
}

/* ─── Horizontal step progress ─── */
function StepProgress({ currentStep }: { currentStep: string }) {
  const { t } = useTranslation();
  const steps = [
    { key: "bundle", label: t("steps.configure"), n: 1 },
    { key: "assignLikes", label: t("steps.likes"), n: 2 },
    { key: "assignViews", label: t("steps.views"), n: 3 },
    { key: "recap", label: t("steps.checkout"), n: 4 },
  ];

  const activeSteps = ["bundle", "assignLikes", "assignViews", "recap", "checkout"];
  if (!activeSteps.includes(currentStep)) return null;

  const currentIdx = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center gap-1 sm:gap-3 mb-6">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1 sm:gap-3">
          <StepBadge number={s.n} label={s.label} active={s.key === currentStep} done={i < currentIdx} />
          {i < steps.length - 1 && (
            <ChevronRight className={`w-3 h-3 ${i < currentIdx ? "text-emerald-500/40" : "text-white/[0.08]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Scroll section tracker (fires once per section) ─── */
function useScrollSectionTracker(posthog: ReturnType<typeof usePostHog>, variant: string, currency: string) {
  const firedRef = useRef<Set<string>>(new Set());
  const observe = useCallback(
    (sectionName: string) => (node: HTMLElement | null) => {
      if (!node || firedRef.current.has(sectionName)) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !firedRef.current.has(sectionName)) {
            firedRef.current.add(sectionName);
            posthog?.capture("section_viewed", { section: sectionName, variant, currency });
            observer.disconnect();
          }
        },
        { threshold: 0.3 },
      );
      observer.observe(node);
    },
    [posthog, variant, currency],
  );
  return observe;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE — homepage "Same hero as pricing-socials + Whitehat below-fold"
   ═══════════════════════════════════════════════════════════════ */
export default function Pricing2Page() {
  const posthog = usePostHog();
  const isMobile = useIsMobile();
  const { currency } = useCurrency();
  const hasTrackedRef = useRef(false);
  const trackSection = useScrollSectionTracker(posthog, "homepage", currency);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const {
    step,
    platform,
    profile,
    profileError,
    username,
    followersQty,
    likesQty,
    viewsQty,
    setStep,
    setProfile,
    setFollowersQty,
    setLikesQty,
    setViewsQty,
    setCheckoutOpen,
    reset,
  } = useTiktokUpsellStore();

  const accent = TT_ACCENT;
  const gradient = TT_GRADIENT;

  const { t } = useTranslation();
  const { getTierPrice: getPrice, resolved: pricingTiers } = usePricingTiers(currency);

  const faqs = [
    { q: t("pricing2.faq1Q"), a: t("pricing2.faq1A") },
    { q: t("pricing2.faq2Q"), a: t("pricing2.faq2A") },
    { q: t("pricing2.faq3Q"), a: t("pricing2.faq3A") },
    { q: t("pricing2.faq4Q"), a: t("pricing2.faq4A") },
    { q: t("pricing2.faq5Q"), a: t("pricing2.faq5A") },
    { q: t("pricing2.faq6Q"), a: t("pricing2.faq6A") },
    { q: t("pricing2.faq7Q"), a: t("pricing2.faq7A") },
  ];
  const searchParams = useSearchParams();
  const { setDiscountPct } = useTiktokUpsellStore();

  /* Platform is always tiktok */

  /* Read discount from URL param (e.g. ?discount=20) */
  useEffect(() => {
    const d = parseInt(searchParams.get("discount") || "0", 10);
    if (d > 0 && d <= 50) setDiscountPct(d);
  }, [searchParams, setDiscountPct]);

  /* Track page view once */
  useEffect(() => {
    if (!hasTrackedRef.current) {
      posthog?.capture("pricing2_page_viewed", { referrer: document.referrer || "direct", variant: "homepage", currency, platform, utm_source: searchParams.get("utm_source") || undefined, utm_campaign: searchParams.get("utm_campaign") || undefined, discount: searchParams.get("discount") || undefined });
      hasTrackedRef.current = true;
    }
  }, []);

  /* ─── localStorage bundle persistence ─── */
  const LS_KEY = "vpx_tiktok_bundle";
  useEffect(() => {
    if (step === "search" || step === "scanning") return;
    if (!username) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        username, followersQty, likesQty, viewsQty, ts: Date.now(),
      }));
    } catch {}
  }, [username, followersQty, likesQty, viewsQty, step]);

  const didRestoreRef = useRef(false);
  useEffect(() => {
    if (didRestoreRef.current || step !== "search") return;
    didRestoreRef.current = true;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (Date.now() - saved.ts > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(LS_KEY);
        return;
      }
      if (saved.followersQty) setFollowersQty(saved.followersQty);
      if (saved.likesQty) setLikesQty(saved.likesQty);
      if (saved.viewsQty) setViewsQty(saved.viewsQty);
    } catch {}
  }, []);

  useEffect(() => {
    if (step === "checkout") {
      try { localStorage.removeItem(LS_KEY); } catch {}
    }
  }, [step]);

  /* ─── Skip recap for tiny orders ─── */
  const SKIP_RECAP_THRESHOLD = 10;
  const computedTotal = getPrice("tiktok", followersQty) + getPrice("tiktokLikes", likesQty) + getPrice("tiktokViews", viewsQty);

  /* ─── Lazy-load videos/posts in background ─── */
  const videosFetchedRef = useRef(false);
  useEffect(() => {
    if (!profile?.username || videosFetchedRef.current) return;
    if (profile.posts.length > 0) return;

    videosFetchedRef.current = true;
    let cancelled = false;

    const pollUrl = `/api/scraper-tiktok/videos?username=${encodeURIComponent(profile.username)}`;

    const poll = async () => {
      for (let attempt = 0; attempt < 8; attempt++) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, attempt === 0 ? 1000 : 2000));
        if (cancelled) return;
        try {
          const res = await fetch(pollUrl);
          if (!res.ok) continue;
          const data = await res.json();
          if (data.posts && data.posts.length > 0) {
            setProfile({ ...profile, posts: data.posts });
            return;
          }
        } catch { /* retry */ }
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [profile?.username]);

  /* Scroll on step change + track */
  const firstBundleRef = useRef(true);
  useEffect(() => {
    if (step !== "search" && step !== "scanning") {
      if (step === "bundle" && firstBundleRef.current) {
        firstBundleRef.current = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        document.getElementById("bundle-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    posthog?.capture("step_changed", { step, platform, currency, variant: "homepage" });
  }, [step]);

  const hasPosts = (profile?.posts?.length ?? 0) > 0;
  const isSearchPhase = step === "search" || step === "scanning";
  const isConfigPhase = !isSearchPhase;

  return (
    <>
      {/* ───────────── SEARCH PHASE: Full-width split hero (SAME AS pricing-socials) ───────────── */}
      {isSearchPhase && (
        <div className="relative z-10 min-h-[112dvh] sm:min-h-[100dvh] lg:min-h-screen flex flex-col">
          {/* Multi-layer gradient mesh background */}
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <div className="absolute top-[5%] left-[10%] w-[600px] h-[600px] rounded-full blur-[180px] opacity-[0.08] transition-colors duration-700" style={{ backgroundColor: accent }} />
            <div className="absolute top-[40%] right-[5%] w-[500px] h-[500px] rounded-full blur-[160px] opacity-[0.05]" style={{ backgroundColor: "#69C9D0" }} />
            <div className="absolute bottom-[10%] left-[30%] w-[400px] h-[400px] rounded-full blur-[140px] opacity-[0.04]" style={{ backgroundColor: "#ee1d52" }} />
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
          </div>

          {/* Main split hero */}
          <div className="relative z-10 flex-1 flex items-center">
            <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 py-0 sm:py-16 md:py-0 lg:py-0">
              <div className="relative max-w-2xl sm:max-w-3xl lg:max-w-none xl:max-w-none mx-auto min-h-[100dvh] sm:min-h-0 lg:min-h-[85vh] flex flex-col justify-center items-center sm:items-start text-center sm:text-left pt-0 sm:pt-0 lg:pt-8 xl:pt-12">
                {mounted ? <>
                  {/* Animated badge */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="absolute top-3 left-1/2 -translate-x-1/2 sm:top-6 sm:left-0 sm:translate-x-0 lg:top-10 xl:top-14">
                    <div className="rounded-xl border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.08] flex items-center w-fit px-3 py-2 text-xs text-zinc-300 mx-auto md:mx-0">
                      <span className="relative flex ml-0.5 mr-2.5 h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                      </span>
                      Tous les services sont fonctionnels
                    </div>
                  </motion.div>

                  {/* H1 */}
                  <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="mt-16 sm:mt-0 text-[clamp(2.2rem,9vw,6.2rem)] md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-[5.2rem] font-extrabold text-white tracking-[-0.03em] leading-[0.98] md:leading-tight lg:leading-[1.05] mb-7 sm:mb-5 lg:mb-8">
                    {t("pricing.heroTitle")}{" "}
                    <span className="relative inline-block">
                      <span className="bg-gradient-to-r from-[#69C9D0] via-[#9BE8EC] to-[#ee1d52] bg-clip-text text-transparent">
                        TikTok
                      </span>
                      <span className="absolute -bottom-1 left-0 w-full h-[3px] rounded-full bg-gradient-to-r from-[#69C9D0] via-[#9BE8EC] to-[#ee1d52] opacity-60" />
                    </span>
                    <span className="hidden sm:inline"><br /></span>{" "}
                    {t("pricing.heroTitleEnd")}
                  </motion.h1>

                  {/* Subtitle — desktop only */}
                  <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="hidden sm:block text-[16px] md:text-[17px] lg:text-[19px] xl:text-[20px] text-zinc-400 leading-relaxed sm:leading-[1.7] mb-10 lg:mb-12 max-w-lg md:max-w-xl lg:max-w-2xl">
                    {t("pricing2.heroSubtitle")}
                  </motion.p>

                  {/* Search Card (CTA) */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }} className="mb-32 sm:mb-14 lg:mb-16 xl:mb-20">
                    <div id="search-card" className="relative max-w-lg sm:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto sm:mx-0">
                      {/* Ambient glow */}
                      <div className="absolute -inset-6 rounded-[48px] opacity-[0.08] blur-[48px] translate-y-8 sm:translate-y-4 lg:blur-[64px] lg:-inset-8" style={{ background: gradient }} />

                      <ProfileSearchInput />

                      {profileError && (
                        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-[13px] text-red-400">
                          {profileError}
                        </motion.p>
                      )}

                      {/* Inline trust — single clean line */}
                      <div className="mt-4 flex items-center justify-center gap-4 sm:gap-6 sm:justify-start lg:gap-8">
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-zinc-600" />
                          <span className="text-[10px] sm:text-[11px] text-zinc-500">{t("pricing2.trustBadge2")}</span>
                        </div>
                        <div className="w-px h-3 bg-white/[0.06]" />
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-zinc-600" />
                          <span className="text-[10px] sm:text-[11px] text-zinc-500">{t("pricing2.trustBadge4")}</span>
                        </div>
                        <div className="hidden sm:block w-px h-3 bg-white/[0.06]" />
                        <div className="hidden sm:flex items-center gap-1">
                          <Lock className="w-3 h-3 text-zinc-600" />
                          <span className="text-[10px] sm:text-[11px] text-zinc-500">{t("pricing2.trustBadge3")}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Social proof row — hidden on mobile to keep hero above fold */}
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="hidden sm:flex sm:flex-row sm:items-center gap-5 sm:gap-8 lg:gap-12 mt-14 lg:mt-16 xl:mt-20">
                    <HeroReviews />
                    <div className="flex items-center gap-4 lg:gap-5 ml-auto">
                      {[
                        { value: "4 200+", label: t("pricing.statCreators") },
                        { value: "98%", label: t("pricing.statSatisfaction") },
                      ].map((stat, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2 lg:px-5 lg:py-3 rounded-xl lg:rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                          <p className="text-[14px] lg:text-[16px] font-bold text-white leading-none">{stat.value}</p>
                          <p className="text-[10px] lg:text-[11px] text-zinc-500">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                </> : null}
              </div>
            </div>
          </div>

          {/* ───────────── BELOW THE FOLD — WHITEHAT content (search phase only) ───────────── */}
          {mounted && <div data-nosnippet="">

            {/* ── 3 Easy Steps (WHITEHAT) ── */}
            <section ref={trackSection("how_it_works")} className="relative z-10 py-12 sm:py-16 md:py-24 lg:py-32 xl:py-36 border-t border-white/[0.04]">
              <div className="max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16">
                <div className="text-center mb-8 sm:mb-12 md:mb-14 lg:mb-20">
                  <h2 className="text-[clamp(1.4rem,3.5vw,2.4rem)] font-bold text-white tracking-tight">
                    {t("pricing2.howItWorks")}{" "}
                    <br />
                    <span className="bg-gradient-to-r from-[#69C9D0] to-[#ee1d52] bg-clip-text text-transparent">
                      {t("pricing2.threeSteps")}
                    </span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-12">
                  {[
                    { n: "1", icon: Search,     title: t("pricing2.step01Title"), desc: t("pricing2.step01Desc") },
                    { n: "2", icon: Eye,         title: t("pricing2.step02Title"), desc: t("pricing2.step02Desc") },
                    { n: "3", icon: TrendingUp,  title: t("pricing2.step03Title"), desc: t("pricing2.step03Desc") },
                  ].map((s, i) => (
                    <div key={s.n} className="relative text-center group">
                      <div
                        className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center border border-white/[0.08] bg-white/[0.03] group-hover:border-white/[0.15] transition-all duration-300"
                        style={{ boxShadow: `0 0 30px -10px ${accent}30` }}
                      >
                        <s.icon className="w-6 h-6" style={{ color: accent }} />
                      </div>

                      {i < 2 && (
                        <div className="hidden md:block absolute top-7 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-white/[0.08] to-transparent" />
                      )}

                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/[0.06] text-[11px] font-bold text-zinc-500 mb-3">
                        {s.n}
                      </div>
                      <h3 className="text-[16px] font-semibold text-white mb-2">{s.title}</h3>
                      <p className="text-[13px] text-zinc-500 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Guarantees — horizontal strip (WHITEHAT) */}
            <section ref={trackSection("guarantees")} className="relative z-10 py-10 sm:py-12 md:py-16 lg:py-24 border-t border-white/[0.04]">
              <div className="max-w-6xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                  {[
                    { icon: Shield, title: t("pricing2.trustBadge1"), desc: t("pricing2.faq1A").slice(0, 80) + "…" },
                    { icon: Check, title: t("pricing2.trustBadge2"), desc: t("pricing2.faq2A").slice(0, 80) + "…" },
                    { icon: Clock, title: t("pricing.guarantee2Title"), desc: t("pricing.guarantee2Desc") },
                    { icon: CheckCircle2, title: t("pricing.guarantee4Title"), desc: t("pricing.guarantee4Desc") },
                  ].map((g, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}10` }}>
                        <g.icon className="w-5 h-5" style={{ color: accent }} />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-semibold text-white mb-1">{g.title}</h3>
                        <p className="text-[12px] text-zinc-500 leading-relaxed">{g.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* FAQ (WHITEHAT) */}
            <section ref={trackSection("faq")} className="relative z-10 py-12 sm:py-16 md:py-24 lg:py-32 border-t border-white/[0.04]">
              <div className="max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 lg:px-12">
                <div className="text-center mb-8 sm:mb-12">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 mb-3">FAQ</p>
                  <h2 className="text-[clamp(1.4rem,3.5vw,2.4rem)] font-bold text-white tracking-tight">{t("pricing2.faqTitle")}</h2>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6">
                  {faqs.map((faq, i) => (
                    <FAQRow key={i} q={faq.q} a={faq.a} />
                  ))}
                </div>
              </div>
            </section>

            {/* Compliance footer banner */}
            <section className="relative z-10 pb-14 sm:pb-20 lg:pb-28">
              <div className="max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 lg:px-12">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-[13px] font-semibold text-emerald-400">{t("pricing2.trustBadge2")}</span>
                  </div>
                  <p className="text-[13px] text-zinc-500 leading-relaxed max-w-lg mx-auto">
                    {t("pricing2.complianceNote")}
                  </p>
                </div>
              </div>
            </section>

            {/* CTA bottom */}
            <section ref={trackSection("cta_bottom")} className="relative z-10 py-14 sm:py-20 md:py-28 lg:py-36 xl:py-40 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-[0.08]" style={{ background: gradient, filter: "blur(150px)" }} />
                <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full opacity-[0.04]" style={{ backgroundColor: "#69C9D0", filter: "blur(100px)" }} />
              </div>

              <div className="relative z-10 max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 lg:px-12">
                <div className="relative rounded-3xl p-[1px]" style={{ background: `linear-gradient(135deg, ${accent}30, transparent 50%, ${accent}15)` }}>
                  <div className="rounded-2xl sm:rounded-3xl bg-zinc-950/80 backdrop-blur-xl px-5 sm:px-10 md:px-14 lg:px-20 py-10 sm:py-14 md:py-16 lg:py-20 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400 mb-6">
                      <Sparkles className="w-3 h-3" style={{ color: accent }} />
                      {t("pricing.ctaBottomTitle")}
                    </div>

                    <h2 className="text-[clamp(1.6rem,4vw,2.8rem)] lg:text-4xl xl:text-5xl font-extrabold text-white tracking-tight mb-4 lg:mb-6 leading-tight">
                      {t("pricing.heroTitle")}{" "}
                      <span className="bg-gradient-to-r from-[#69C9D0] to-[#ee1d52] bg-clip-text text-transparent">
                        TikTok
                      </span>
                    </h2>
                    <p className="text-[15px] lg:text-[17px] text-zinc-400 mb-8 lg:mb-10 max-w-md lg:max-w-lg mx-auto leading-relaxed">
                      {t("pricing.ctaBottomSubtitle")}
                    </p>

                    <button
                      onClick={() => { posthog?.capture("cta_bottom_clicked", { variant: "homepage", platform, currency }); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 sm:px-10 lg:px-12 py-4 sm:py-5 lg:py-6 min-h-[48px] rounded-2xl lg:rounded-3xl text-white text-[15px] sm:text-[16px] lg:text-[17px] font-bold transition-all duration-300 hover:scale-[1.04] active:scale-[0.97]"
                      style={{ background: gradient, boxShadow: `0 0 60px -10px ${accent}50, 0 0 20px -5px ${accent}30` }}
                    >
                      <TikTokIcon className="w-5 h-5" />
                      <span className="flex flex-col items-start leading-tight">
                        <span>{t("pricing.ctaBottomButton")}</span>
                        {(() => {
                          const tiers = pricingTiers.tiktok;
                          const first = tiers?.[0];
                          if (!first) return null;
                          return (
                            <span className="text-[11px] font-normal text-white/60">
                              {t("pricing.ctaFromPrice", { price: formatCurrency(first.price, currency) })}
                            </span>
                          );
                        })()}
                      </span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-5 sm:gap-6 text-[11px] text-zinc-500">
                      <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-zinc-600" /> {t("pricing2.trustBadge1")}</span>
                      <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-zinc-600" /> {t("pricing2.trustBadge2")}</span>
                      <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-zinc-600" /> {t("pricing2.trustBadge3")}</span>
                    </div>

                  </div>
                </div>
              </div>
            </section>
          </div>}
        </div>
      )}

      {/* ───────────── CONFIG PHASE: Split layout (desktop) — SAME AS pricing-socials ───────────── */}
      {isConfigPhase && (
        <div id="flow-section" className="relative min-h-[100dvh]">
          {/* Subtle background */}
          <div className="pointer-events-none fixed inset-0 z-0">
            <div className="absolute top-[30%] left-[20%] w-[500px] h-[500px] rounded-full blur-[160px] opacity-[0.06] transition-colors duration-700" style={{ backgroundColor: accent }} />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 py-6 md:py-10 lg:py-12">
            {/* Top bar: back + steps */}
            <div className="flex items-center justify-between mb-3">
              <button onClick={reset} className="text-[13px] text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5">
                <ChevronDown className="w-3.5 h-3.5 rotate-90" />
                {t("pricing.newSearch")}
              </button>
              <div className="hidden md:block">
                <StepProgress currentStep={step} />
              </div>
            </div>

            {/* Mobile step progress */}
            <div className="md:hidden mb-2">
              <StepProgress currentStep={step} />
            </div>

            {/* Split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              {/* LEFT SIDEBAR — Profile + trust (sticky on desktop) */}
              <div className="lg:col-span-5 xl:col-span-4 min-w-0">
                <div className="lg:sticky lg:top-6 space-y-4">
                  {/* Profile card */}
                  <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 overflow-hidden">
                    <ProfileCard />
                  </div>

                  {/* Trust sidebar (WHITEHAT) */}
                  <div className="hidden lg:block rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 space-y-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-600 mb-2">{t("pricing.guaranteesLabel")}</p>
                    {[
                      { icon: Shield, text: t("pricing2.trustBadge1") },
                      { icon: Check, text: t("pricing2.trustBadge2") },
                      { icon: CheckCircle2, text: t("pricing.guaranteeRefund") },
                      { icon: Lock, text: t("pricing.guaranteeStripe") },
                    ].map((g, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <g.icon className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
                        <span className="text-[12px] text-zinc-400">{g.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Payment badges */}
                  <div className="hidden lg:flex items-center justify-center gap-2 py-3">
                    <Image
                      src="/badges_paiement.png"
                      alt="Accepted payment methods"
                      width={140}
                      height={18}
                      className="h-4 w-auto object-contain opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT — Main content area */}
              <div id="bundle-content" className="lg:col-span-7 xl:col-span-8 min-w-0">
                <AnimatePresence mode="wait">
                  {/* ══════════ BUNDLE ══════════ */}
                  {step === "bundle" && profile && (
                    <motion.div
                      key="bundle"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <BundleConfigurator />
                    </motion.div>
                  )}

                  {/* ══════════ ASSIGN LIKES ══════════ */}
                  {step === "assignLikes" && profile && (
                    <motion.div
                      key="assignLikes"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <VideoSelector
                        mode="likes"
                        totalQty={likesQty}
                        onBack={() => setStep("bundle")}
                        onContinue={() => {
                          if (viewsQty > 0) {
                            setStep("assignViews");
                          } else {
                            setStep("recap");
                          }
                        }}
                      />
                    </motion.div>
                  )}

                  {/* ══════════ ASSIGN VIEWS ══════════ */}
                  {step === "assignViews" && profile && (
                    <motion.div
                      key="assignViews"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <VideoSelector
                        mode="views"
                        totalQty={viewsQty}
                        onBack={() => {
                          if (likesQty > 0) {
                            setStep("assignLikes");
                          } else {
                            setStep("bundle");
                          }
                        }}
                        onContinue={() => {
                          setStep("recap");
                        }}
                      />
                    </motion.div>
                  )}

                  {/* ══════════ RECAP ══════════ */}
                  {(step === "recap" || step === "checkout") && profile && (
                    <motion.div
                      key="recap"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <OrderRecap
                        onBack={() => {
                          if (viewsQty > 0) {
                            setStep("assignViews");
                          } else if (likesQty > 0) {
                            setStep("assignLikes");
                          } else {
                            setStep("bundle");
                          }
                        }}
                      />

                      {/* Payment badges (mobile) */}
                      <div className="mt-6 flex items-center justify-center gap-3 lg:hidden flex-wrap">
                        <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                          <Shield className="w-3 h-3" />
                          <span>{t("pricing.stripeSecured")}</span>
                        </div>
                        <Image
                          src="/badges_paiement.png"
                          alt="Accepted payment methods"
                          width={160}
                          height={20}
                          className="h-5 w-auto object-contain opacity-60"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────── BUNDLE CHECKOUT MODAL ───────────── */}
      <BundleCheckoutModal />
    </>
  );
}
