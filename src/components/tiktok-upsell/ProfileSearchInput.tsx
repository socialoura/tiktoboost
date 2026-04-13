"use client";

import { useState, useRef } from "react";
import { Flame, Loader2, Search } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useTiktokUpsellStore } from "@/store/useTiktokUpsellStore";
import { extractUsername } from "@/lib/extract-username";
import { usePricingTiers } from "@/hooks/usePricingTiers";
import { useCurrency } from "@/context/CurrencyContext";
import { formatCurrency } from "@/lib/currency";
import { useTranslation } from "@/context/TranslationContext";
import type { TiktokProfile } from "@/types/tiktok";

const TT_GRADIENT = "linear-gradient(135deg, #69C9D0 0%, #ee1d52 100%)";

function useScanMessages(t: (key: string) => string) {
  return [
    t("pricing.scanTTConnect"),
    t("pricing.scanTTProfile"),
    t("pricing.scanTTVideos"),
    t("pricing.scanTTEngagement"),
  ];
}

export default function ProfileSearchInput() {
  const posthog = usePostHog();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localUsername, setLocalUsername] = useState("");
  const { currency } = useCurrency();
  const { t } = useTranslation();
  const { resolved: pricingTiers } = usePricingTiers(currency);

  const {
    step,
    platform,
    setStep,
    setUsername,
    setProfile,
    setProfileLoading,
    setProfileError,
    profileLoading,
  } = useTiktokUpsellStore();

  const scanMessages = useScanMessages(t);
  const gradient = TT_GRADIENT;
  const accentColor = "#ee1d52";
  const accentColor2 = "#69C9D0";

  const [scanMsg, setScanMsg] = useState(scanMessages[0]);
  const [suggestion, setSuggestion] = useState<{ username: string; nickname?: string; fullName?: string; avatarUrl?: string } | null>(null);

  const handleSearch = async (overrideUsername?: string) => {
    const clean = extractUsername(overrideUsername ?? localUsername);
    if (!clean) {
      inputRef.current?.focus();
      return;
    }

    // Blur input to reset iOS Safari auto-zoom
    inputRef.current?.blur();

    posthog?.capture("username_submitted", { username: clean, platform, currency });
    setUsername(clean);
    setProfileLoading(true);
    setProfileError(null);
    setProfile(null);
    setStep("scanning");
    setScanMsg(scanMessages[0]);

    // Rotate scan messages
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      if (i < scanMessages.length) setScanMsg(scanMessages[i]);
    }, 700);

    // Min 2.5s UX delay + fetch
    const timerPromise = new Promise((r) => setTimeout(r, 2500));

    const apiUrl = `/api/scraper-tiktok?username=${encodeURIComponent(clean)}`;

    try {
      const [res] = await Promise.all([
        fetch(apiUrl),
        timerPromise,
      ]);

      clearInterval(interval);

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: t("pricing.profileNotFound") }));
        posthog?.capture("profile_not_found", { username: clean, platform, currency, has_suggestion: !!data.suggestion });
        if (data.suggestion) {
          setSuggestion(data.suggestion);
          setProfileError(data.error || t("pricing.profileNotFound"));
        } else {
          setProfileError(data.error || t("pricing.profileNotFound"));
        }
        setStep("search");
        setProfileLoading(false);
        return;
      }
      setSuggestion(null);

      const profile: TiktokProfile = await res.json();
      posthog?.capture("profile_found", {
        username: clean,
        platform,
        currency,
        followers: profile.followersCount,
        posts: profile.posts.length,
      });
      setProfile(profile);
      setStep("bundle");
    } catch {
      clearInterval(interval);
      setProfileError(t("pricing.fetchFailed"));
      setStep("search");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  if (step === "scanning") {
    return (
      <div className="flex flex-col items-center gap-6 sm:gap-8 py-8 sm:py-12">
        <div className="relative w-20 h-20 sm:w-28 sm:h-28">
          <div className="absolute inset-0 rounded-full blur-xl opacity-40 animate-pulse" style={{ backgroundColor: accentColor }} />
          <div className="absolute inset-2 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: accentColor, animationDuration: "1.2s" }} />
          <div className="absolute inset-4 rounded-full border-2 border-transparent animate-spin" style={{ borderBottomColor: accentColor2, animationDuration: "1.8s", animationDirection: "reverse" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="w-5 h-5 sm:w-7 sm:h-7 text-white/60" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-[13px] text-zinc-500 mb-2">
            {t("pricing.analyzing")} <span className="text-white font-medium">@{localUsername.replace(/^@/, "").trim()}</span>
          </p>
          <p className="text-[15px] sm:text-[17px] font-medium text-white">{scanMsg}</p>
        </div>
        <div className="w-48 sm:w-64 h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full animate-[grow_2.5s_linear_forwards]"
            style={{ background: gradient }}
          />
        </div>
        <style>{`@keyframes grow { from { width: 0% } to { width: 100% } }`}</style>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl lg:max-w-2xl mx-auto sm:mx-0">
      <p className="flex items-center gap-1.5 text-[12px] sm:text-[13px] text-zinc-500 mb-3 sm:mb-2">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/[0.06] border border-white/[0.08] text-[9px] font-bold text-zinc-400 flex-shrink-0">i</span>
        {t("pricing.accountPublic")}
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-3">
        <div className="relative w-full">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 text-[16px] sm:text-[15px] font-medium select-none">@</span>
          <input
            ref={inputRef}
            type="text"
            value={localUsername}
            onChange={(e) => setLocalUsername(e.target.value)}
            onFocus={() => posthog?.capture("input_focused", { platform, currency })}
            onKeyDown={handleKeyDown}
            placeholder={t("pricing.enterTikTokUsername")}
            className="w-full pl-11 pr-5 py-5 sm:py-4 lg:py-5 rounded-3xl sm:rounded-2xl lg:rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white text-[17px] sm:text-[15px] lg:text-[16px] placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.08] transition-all duration-300"
            autoComplete="off"
            spellCheck={false}
            disabled={profileLoading}
          />
        </div>
        <button
          onClick={() => handleSearch()}
          disabled={profileLoading}
          className="shine cta-pulse w-full sm:w-auto whitespace-nowrap inline-flex items-center justify-center gap-2.5 px-8 sm:px-7 lg:px-9 py-5 sm:py-4 lg:py-5 rounded-3xl sm:rounded-2xl lg:rounded-2xl text-white text-[16px] sm:text-[15px] lg:text-[16px] font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:animate-none"
          style={{ background: gradient, boxShadow: `0 0 30px -6px ${accentColor}50` }}
        >
          {profileLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Flame className="w-4 h-4" />
              {(() => {
                const tiers = pricingTiers.tiktok;
                const first = tiers?.[0];
                if (!first) return t("pricing.boostTiktok");
                return t("pricing.ctaFromPrice", { price: formatCurrency(first.price, currency) });
              })()}
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col justify-center items-center mt-12 sm:mt-4 sm:items-start">
        <div className="flex items-center">
          <span className="font-medium text-xl mt-2 mr-2">4.8 <span className="opacity-70">|</span></span>
          <img className="h-[24px] mt-2" src="/stars52.svg" alt="4.8 rating stars" />
        </div>
      </div>

      {/* ─── Suggestion: "Did you mean @username?" ─── */}
      {suggestion && (
        <button
          onClick={() => {
            posthog?.capture("suggestion_clicked", { suggested_username: suggestion.username, platform, currency });
            setLocalUsername(suggestion.username);
            setSuggestion(null);
            handleSearch(suggestion.username);
          }}
          className="mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300 text-left"
        >
          {suggestion.avatarUrl && (
            <img
              src={suggestion.avatarUrl}
              alt=""
              className="w-10 h-10 rounded-full object-cover border border-white/[0.1]"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-zinc-400">
              {t("pricing.didYouMean")}
            </p>
            <p className="text-[15px] font-semibold text-white truncate">
              @{suggestion.username}
              {(suggestion.nickname || suggestion.fullName) && (
                <span className="ml-1.5 text-zinc-500 font-normal text-[13px]">
                  {suggestion.nickname || suggestion.fullName}
                </span>
              )}
            </p>
          </div>
          <div className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-medium text-white" style={{ background: gradient }}>
            {t("pricing.searchBtn")}
          </div>
        </button>
      )}
    </div>
  );
}
