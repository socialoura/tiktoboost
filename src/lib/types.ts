export interface OrderPayload {
  orderId: string;
  email: string;
  username: string;
  platform: "tiktok";
  service: string;
  quantity: string;
  price: number;
  currency?: string;
  followersQty?: number;
  likesQty?: number;
  viewsQty?: number;
  assignments?: {
    likes?: Array<{ postId: string; quantity: number; imageUrl?: string }>;
    views?: Array<{ postId: string; quantity: number; imageUrl?: string }>;
  };
}
