"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ArrowLeft, Check, Heart, Eye } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useTranslation } from "@/context/TranslationContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useTiktokUpsellStore } from "@/store/useTiktokUpsellStore";
import { formatQty } from "@/config/tiktok-services";
import type { VideoAssignment } from "@/types/tiktok";

const TT_GRADIENT = "linear-gradient(135deg, #69C9D0 0%, #ee1d52 100%)";

interface VideoSelectorProps {
  mode: "likes" | "views";
  totalQty: number;
  onBack: () => void;
  onContinue: () => void;
}

export default function VideoSelector({ mode, totalQty, onBack, onContinue }: VideoSelectorProps) {
  const posthog = usePostHog();
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const { profile, platform, setLikesAssignments, setViewsAssignments } = useTiktokUpsellStore();
  const posts = profile?.posts ?? [];

  const label = mode === "likes" ? t("pricing.likes") : t("pricing.views");
  const color = mode === "likes" ? "#ec4899" : "#69C9D0";
  const IconComponent = mode === "likes" ? Heart : Eye;

  // Simple toggle selection — start with none selected (all greyed out)
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const selectedCount = selected.size;

  // Computed distribution: evenly split across selected videos
  const perVideo = useMemo(() => {
    if (selectedCount === 0) return 0;
    return Math.floor(totalQty / selectedCount);
  }, [totalQty, selectedCount]);

  const remainder = useMemo(() => {
    if (selectedCount === 0) return 0;
    return totalQty - perVideo * selectedCount;
  }, [totalQty, perVideo, selectedCount]);

  const toggleVideo = (postId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(posts.slice(0, 12).map((p) => p.id)));
  };

  const clearAll = () => {
    setSelected(new Set());
  };

  const handleContinue = () => {
    // If no videos selected, auto-select all
    const effectivePosts = selectedCount === 0
      ? posts.slice(0, 12)
      : posts.filter((p) => selected.has(p.id));
    const effectiveCount = effectivePosts.length;
    const pv = effectiveCount > 0 ? Math.floor(totalQty / effectiveCount) : 0;
    const rem = effectiveCount > 0 ? totalQty - pv * effectiveCount : 0;
    const videoAssignments: VideoAssignment[] = effectivePosts.map((p, i) => ({
      postId: p.id,
      imageUrl: p.imageUrl,
      caption: p.caption,
      quantity: pv + (i < rem ? 1 : 0),
    }));

    posthog?.capture(`${mode}_assigned`, {
      username: profile?.username,
      platform,
      currency,
      total: totalQty,
      videos_count: videoAssignments.length,
    });

    if (mode === "likes") {
      setLikesAssignments(videoAssignments);
    } else {
      setViewsAssignments(videoAssignments);
    }
    onContinue();
  };

  if (posts.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-[clamp(1.2rem,3vw,1.8rem)] font-semibold text-white tracking-tight">
            {t("pricing.selectVideosFor")}{" "}
            <span style={{ color }}>{formatQty(totalQty)} {label}</span>
          </h2>
          <p className="mt-2 text-[12px] sm:text-[13px] text-zinc-400 px-2 sm:px-0">
            {t("pricing.loadingPosts")}
          </p>
        </div>
        <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.03]">
              <div className="aspect-[9/16] animate-pulse bg-white/[0.04]" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-start">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 sm:px-5 py-3 rounded-xl text-[12px] sm:text-[13px] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {t("pricing.back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-[clamp(1.2rem,3vw,1.8rem)] font-semibold text-white tracking-tight">
          {t("pricing.selectVideosFor")}{" "}
          <span style={{ color }}>{formatQty(totalQty)} {label}</span>
        </h2>
        <p className="mt-2 text-[12px] sm:text-[13px] text-zinc-400 px-2 sm:px-0">
          {t("pricing.tapToBoost", { service: label })}
        </p>
      </div>

      {/* Auto-distribute shortcut */}
      <button
        onClick={() => {
          selectAll();
          // Use a microtask so selectAll state settles, then auto-continue
          setTimeout(() => {
            const allIds = posts.slice(0, 12);
            const pv = Math.floor(totalQty / allIds.length);
            const rem = totalQty - pv * allIds.length;
            const assignments: VideoAssignment[] = allIds.map((p, i) => ({
              postId: p.id,
              imageUrl: p.imageUrl,
              caption: p.caption,
              quantity: pv + (i < rem ? 1 : 0),
            }));
            posthog?.capture(`${mode}_auto_distributed`, {
              username: profile?.username,
              platform,
              currency,
              total: totalQty,
              videos_count: assignments.length,
            });
            if (mode === "likes") setLikesAssignments(assignments);
            else setViewsAssignments(assignments);
            onContinue();
          }, 50);
        }}
        className="w-full mb-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-all text-center"
      >
        <span className="text-[13px] text-zinc-300 font-medium">{t("pricing.autoDistribute")}</span>
        <span className="block text-[11px] text-zinc-500 mt-0.5">~{formatQty(Math.floor(totalQty / Math.min(posts.length, 12)))} {label} / {t("pricing.video")}</span>
      </button>

      {/* Status bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-5 px-1">
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-zinc-400">
            <span className="font-semibold text-white">{selectedCount}</span> / {Math.min(posts.length, 12)} {Math.min(posts.length, 12) <= 1 ? t("pricing.video") : t("pricing.videos")} {t("pricing.selected")}
          </span>
          {selectedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[12px] text-zinc-500">
              ~{formatQty(perVideo)} {label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={selectAll} className="text-[11px] text-zinc-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.06]">
            {t("pricing.selectAll")}
          </button>
          <button onClick={clearAll} className="text-[11px] text-zinc-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.06]">
            {t("pricing.clear")}
          </button>
        </div>
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
        {posts.slice(0, 12).map((post, i) => {
          const isSelected = selected.has(post.id);
          const qtyForThis = isSelected ? perVideo + (i < remainder ? 1 : 0) : 0;
          return (
            <button
              key={post.id}
              type="button"
              onClick={() => toggleVideo(post.id)}
              className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 group cursor-pointer ${
                isSelected
                  ? "border-opacity-100 scale-[1.02] shadow-lg"
                  : "border-transparent opacity-50 hover:opacity-80"
              }`}
              style={isSelected ? { borderColor: color, boxShadow: `0 4px 20px ${color}25` } : undefined}
            >
              {/* Thumbnail */}
              <div className="relative aspect-[9/16]">
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='178' fill='%2318181b'%3E%3Crect width='100' height='178'/%3E%3C/svg%3E"; }}
                />

                {/* Dark overlay for unselected */}
                {!isSelected && (
                  <div className="absolute inset-0 bg-black/40" />
                )}

                {/* Checkmark badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                )}

                {/* Bottom stats overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-6">
                  <div className="flex items-center gap-1.5 text-white/80 text-[10px]">
                    <span className="flex items-center gap-0.5">
                      <Heart className="w-2.5 h-2.5" fill="currentColor" />
                      {formatQty(post.likesCount)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Eye className="w-2.5 h-2.5" />
                      {formatQty(post.viewsCount)}
                    </span>
                  </div>

                  {/* Qty badge when selected */}
                  {isSelected && qtyForThis > 0 && (
                    <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white" style={{ backgroundColor: `${color}cc` }}>
                      <IconComponent className="w-2.5 h-2.5" />
                      +{formatQty(qtyForThis)}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Desktop navigation */}
      <div className="hidden sm:flex mt-6 sm:mt-8 items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("pricing.back")}
        </button>
        <button
          onClick={handleContinue}
          className="shine inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white text-[14px] font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ background: TT_GRADIENT }}
        >
          {(() => { const c = selectedCount > 0 ? selectedCount : Math.min(posts.length, 12); return `${t("pricing.continue")} (${c} ${c <= 1 ? t("pricing.video") : t("pricing.videos")})`; })()}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile sticky spacer */}
      <div className="sm:hidden h-[72px]" />

      {/* Mobile sticky bottom bar */}
      {typeof document !== 'undefined' && createPortal(
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[9999] safe-area-bottom">
          <div className="bg-zinc-950 border-t border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-3 rounded-xl text-[13px] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleContinue}
                className="shine flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-white text-[14px] font-bold tracking-tight transition-all active:scale-[0.96]"
                style={{ background: TT_GRADIENT, boxShadow: '0 4px 20px -4px rgba(238,29,82,0.4)' }}
              >
                {(() => { const c = selectedCount > 0 ? selectedCount : Math.min(posts.length, 12); return `${t("pricing.continue")} (${c} ${c <= 1 ? t("pricing.video") : t("pricing.videos")})`; })()}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
