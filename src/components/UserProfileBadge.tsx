/* ═══════════════════════════════════════════════════════════════
   UserProfileBadge — Displays avatar + optional follower count
   with platform-colored border and loading skeleton.
   ═══════════════════════════════════════════════════════════════ */

"use client";

import { useSocialProfile } from "@/hooks/useSocialProfile";

interface UserProfileBadgeProps {
  username: string;
  platform: "tiktok";
  showFollowers?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { avatar: "w-8 h-8", text: "text-[12px]", count: "text-[11px]", ring: "ring-2" },
  md: { avatar: "w-11 h-11", text: "text-[13px]", count: "text-[12px]", ring: "ring-2" },
  lg: { avatar: "w-16 h-16", text: "text-[15px]", count: "text-[13px]", ring: "ring-[3px]" },
};

const GRADIENTS = {
  tiktok: "from-[#69C9D0] to-[#ee1d52]",
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toString();
}

export default function UserProfileBadge({
  username,
  platform,
  showFollowers = true,
  size = "md",
}: UserProfileBadgeProps) {
  const { profile, loading, error } = useSocialProfile(username, platform);
  const s = SIZES[size];
  const grad = GRADIENTS[platform];

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="inline-flex items-center gap-3">
        <div className={`${s.avatar} rounded-full bg-white/[0.06] animate-pulse`} />
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-20 rounded bg-white/[0.06] animate-pulse" />
          {showFollowers && <div className="h-2.5 w-14 rounded bg-white/[0.06] animate-pulse" />}
        </div>
      </div>
    );
  }

  /* ── If profile not found, error, 0 followers (likely fake/non-existent), or only a fallback avatar, render nothing ── */
  const isFallback = !profile || error || profile.followersCount === 0 || profile.followersCount == null || (!profile.photoUrl || profile.photoUrl.includes("ui-avatars.com"));
  if (isFallback) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-3">
      {/* Avatar with gradient ring */}
      <div className={`relative ${s.avatar} flex-shrink-0`}>
        <div className={`absolute -inset-[3px] rounded-full bg-gradient-to-br ${grad} opacity-80`} />
        <img
          src={profile.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=18181b&color=fff&size=256&bold=true`}
          alt={`@${profile.username}`}
          className={`relative ${s.avatar} rounded-full object-cover bg-zinc-900 ${s.ring} ring-zinc-950`}
          loading="eager"
          onError={(e) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=18181b&color=fff&size=256&bold=true`;
          }}
        />
      </div>

      {/* Text */}
      <div className="flex flex-col min-w-0">
        <span className={`${s.text} font-semibold text-white truncate`}>@{profile.username}</span>
        {showFollowers && profile.followersCount != null && (
          <span className={`${s.count} text-zinc-500`}>
            {formatCount(profile.followersCount)} followers
          </span>
        )}
      </div>
    </div>
  );
}
