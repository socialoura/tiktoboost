import { create } from "zustand";
import type { TiktokProfile, ServiceTier, VideoAssignment } from "@/types/tiktok";

/**
 * Flow steps:
 * search → scanning → bundle → assignLikes → assignViews → recap → checkout
 */
type Step = "search" | "scanning" | "bundle" | "assignLikes" | "assignViews" | "recap" | "checkout";

export type SocialPlatform = "tiktok";

interface TiktokUpsellState {
  /* ── Platform ── */
  platform: "tiktok";

  /* ── Flow ── */
  step: Step;
  setStep: (step: Step) => void;

  /* ── Profile ── */
  username: string;
  setUsername: (u: string) => void;
  profile: TiktokProfile | null;
  setProfile: (p: TiktokProfile | null) => void;
  profileLoading: boolean;
  setProfileLoading: (loading: boolean) => void;
  profileError: string | null;
  setProfileError: (err: string | null) => void;

  /* ── Bundle config (quantities selected) ── */
  followersQty: number;
  setFollowersQty: (n: number) => void;
  likesQty: number;
  setLikesQty: (n: number) => void;
  viewsQty: number;
  setViewsQty: (n: number) => void;

  /* ── Video assignments ── */
  likesAssignments: VideoAssignment[];
  setLikesAssignments: (a: VideoAssignment[]) => void;
  viewsAssignments: VideoAssignment[];
  setViewsAssignments: (a: VideoAssignment[]) => void;

  /* ── Checkout ── */
  checkoutOpen: boolean;
  setCheckoutOpen: (open: boolean) => void;

  /* ── Discount (post-purchase) ── */
  discountPct: number;
  setDiscountPct: (pct: number) => void;

  /* ── Computed helpers ── */
  getTotalPrice: (followersTiers: ServiceTier[], likesTiers: ServiceTier[], viewsTiers: ServiceTier[]) => number;

  /* ── Reset ── */
  reset: () => void;
}

const INITIAL_STATE = {
  step: "search" as Step,
  platform: "tiktok" as SocialPlatform,
  username: "",
  profile: null as TiktokProfile | null,
  profileLoading: false,
  profileError: null as string | null,
  followersQty: 0,
  likesQty: 0,
  viewsQty: 0,
  likesAssignments: [] as VideoAssignment[],
  viewsAssignments: [] as VideoAssignment[],
  checkoutOpen: false,
  discountPct: 0,
};

function findTierPrice(tiers: ServiceTier[], qty: number): number {
  if (qty <= 0 || tiers.length === 0) return 0;
  // Find the tier whose quantity matches or the closest one below
  const sorted = [...tiers].sort((a, b) => a.quantity - b.quantity);
  let best = sorted[0];
  for (const t of sorted) {
    if (t.quantity <= qty) best = t;
    if (t.quantity === qty) return t.price;
  }
  // If qty doesn't exactly match, use proportional pricing based on best tier's per-unit rate
  return Math.round(best.perUnit * qty * 100) / 100;
}

export const useTiktokUpsellStore = create<TiktokUpsellState>((set, get) => ({
  ...INITIAL_STATE,

  setStep: (step) => set({ step }),

  setUsername: (username) => set({ username }),
  setProfile: (profile) => set({ profile }),
  setProfileLoading: (profileLoading) => set({ profileLoading }),
  setProfileError: (profileError) => set({ profileError }),

  setFollowersQty: (followersQty) => set({ followersQty }),
  setLikesQty: (likesQty) => set({ likesQty }),
  setViewsQty: (viewsQty) => set({ viewsQty }),

  setLikesAssignments: (likesAssignments) => set({ likesAssignments }),
  setViewsAssignments: (viewsAssignments) => set({ viewsAssignments }),

  setCheckoutOpen: (checkoutOpen) => set({ checkoutOpen }),

  setDiscountPct: (discountPct) => set({ discountPct }),

  getTotalPrice: (fTiers, lTiers, vTiers) => {
    const s = get();
    const fp = findTierPrice(fTiers, s.followersQty);
    const lp = findTierPrice(lTiers, s.likesQty);
    const vp = findTierPrice(vTiers, s.viewsQty);
    return Math.round((fp + lp + vp) * 100) / 100;
  },

  reset: () => set({ ...INITIAL_STATE }),
}));
