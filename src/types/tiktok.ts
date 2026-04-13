/* ═══════════════════════════════════════════════════════════════
   TikTok Types — Used by / page and scraper API
   ═══════════════════════════════════════════════════════════════ */

export interface TiktokProfile {
  username: string;
  fullName: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  videoCount: number;
  bio: string;
  verified: boolean;
  posts: TiktokPost[];
}

export interface TiktokPost {
  id: string;
  imageUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  isVideo: boolean;
}

export interface FollowerPack {
  id: string;
  followers: number;
  price: number;
  originalPrice: number;
  popular?: boolean;
  bestValue?: boolean;
}

/* ─── Service tier (used for likes/views/followers selection) ─── */
export interface ServiceTier {
  quantity: number;
  price: number;
  originalPrice: number;
  perUnit: number;       // price per unit (e.g. per 100 likes)
}

/* ─── Video assignment ─── */
export interface VideoAssignment {
  postId: string;
  imageUrl: string;
  caption: string;
  quantity: number;       // likes or views assigned to this video
}

/* ─── Complete bundle order ─── */
export interface TiktokBundle {
  followers: ServiceTier | null;
  likes: {
    tier: ServiceTier | null;
    assignments: VideoAssignment[];  // which videos get how many likes
  };
  views: {
    tier: ServiceTier | null;
    assignments: VideoAssignment[];  // which videos get how many views
  };
}

/* ─── Pricing tiers config ─── */
export interface ServicePricingTier {
  quantity: number;
  price: number;
  prices?: Record<string, number>;
}
