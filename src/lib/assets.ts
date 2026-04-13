// Centralized local image paths from public/ folders

export const assets = {
  // Homepage — public/homepage/
  home: {
    image1: "/homepage/1.png",
    image2: "/homepage/2.png",
    image3: "/homepage/3.png",
  },

  // Buy TikTok Followers — public/product-tiktok/
  tiktok: {
    content1: "/product-tiktok/1.png",
    content2: "/product-tiktok/2.png",
    content3: "/product-tiktok/3.png",
  },

  // About Us — public/about-us/
  about: {
    heroImage: "/about-us/1.png",
    visionImage: "/about-us/2.png",
  },
} as const;
