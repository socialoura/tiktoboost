"use client";

import { useMemo } from "react";
import { useTiktokUpsellStore } from "@/store/useTiktokUpsellStore";
import { Heart, CheckCircle2, Users, Video, TrendingUp, ArrowRight } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toString();
}

function getPeopleLikeYouNudge(followers: number, t: (key: string, vars?: Record<string, string>) => string): string {
  const platform = "creators";
  if (followers < 500) return t("pricing.nudgeNew");
  if (followers < 2_000) return t("pricing.nudgeSmall");
  if (followers < 10_000) return t("pricing.nudgeMedium", { platform: platform.charAt(0).toUpperCase() + platform.slice(1), count: formatCount(followers) });
  if (followers < 50_000) return t("pricing.nudgeLarge", { platform: platform.charAt(0).toUpperCase() + platform.slice(1) });
  return t("pricing.nudgeTop", { platform });
}

export default function ProfileCard() {
  const { platform, profile, followersQty, likesQty, viewsQty } = useTiktokUpsellStore();
  const { t } = useTranslation();
  if (!profile) return null;

  const hasSelections = followersQty > 0 || likesQty > 0 || viewsQty > 0;

  const projected = useMemo(() => ({
    followers: profile.followersCount + followersQty,
    likes: profile.likesCount + likesQty,
  }), [profile.followersCount, profile.likesCount, followersQty, likesQty]);

  const nudge = getPeopleLikeYouNudge(profile.followersCount, t);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center gap-5 mb-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-[#69C9D0] to-[#ee1d52] opacity-80" />
          <img
            src={profile.avatarUrl}
            alt={`@${profile.username}`}
            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover bg-zinc-900 ring-[3px] ring-zinc-950"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username)}&background=18181b&color=fff&size=256&bold=true`;
            }}
          />
          {profile.verified && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-zinc-950">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-center sm:text-left">
          <h3 className="text-base sm:text-xl font-bold text-white flex items-center gap-2 justify-center sm:justify-start flex-wrap">
            @{profile.username}
            {profile.fullName && (
              <span className="text-sm font-normal text-zinc-500">{profile.fullName}</span>
            )}
          </h3>
          {profile.bio && (
            <p className="mt-1 text-[13px] text-zinc-400 max-w-sm line-clamp-2">{profile.bio}</p>
          )}
          {/* Stats — before / after */}
          <div className="mt-3 flex items-center gap-3 sm:gap-4 justify-center sm:justify-start flex-wrap">
            <div className="flex items-center gap-1.5 text-sm">
              <Users className="w-3.5 h-3.5" style={{ color: "#ee1d52" }} />
              <span className="font-semibold text-white">{formatCount(profile.followersCount)}</span>
              {followersQty > 0 && (
                <>
                  <ArrowRight className="w-3 h-3 text-emerald-400" />
                  <span className="font-semibold text-emerald-400">{formatCount(projected.followers)}</span>
                </>
              )}
              <span className="text-zinc-500">{t("pricing.followers")}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Heart className="w-3.5 h-3.5 text-pink-400" />
              <span className="font-semibold text-white">{formatCount(profile.likesCount)}</span>
              {likesQty > 0 && (
                <>
                  <ArrowRight className="w-3 h-3 text-emerald-400" />
                  <span className="font-semibold text-emerald-400">{formatCount(projected.likes)}</span>
                </>
              )}
              <span className="text-zinc-500">{t("pricing.likes")}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Video className="w-3.5 h-3.5" style={{ color: "#69C9D0" }} />
              <span className="font-semibold text-white">{profile.videoCount}</span>
              <span className="text-zinc-500">{t("pricing.videos")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* "People like you" nudge */}
      <div className="hidden sm:flex rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 sm:px-4 py-3 mb-6 items-start gap-2.5">
        <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#69C9D0" }} />
        <p className="text-[12px] text-zinc-400 leading-relaxed">{nudge}</p>
      </div>

    </div>
  );
}
