"use client";

import { Check } from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

export interface PricingTier {
  followers: string;
  price: string;
  originalPrice?: string;
  features?: string[];
  popular?: boolean;
}

interface PricingCardProps {
  tier: PricingTier;
  platform: "tiktok";
}

export default function PricingCard({ tier, platform }: PricingCardProps) {
  const { t } = useTranslation();
  const gradientClass = "from-[#010101] to-[#333]";

  return (
    <div
      className={`relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${
        tier.popular
          ? "bg-gradient-to-br " +
            gradientClass +
            " text-white shadow-xl scale-105"
          : "bg-white shadow-[0px_5px_16px_0px_rgba(8,15,52,0.06)] hover:shadow-xl"
      }`}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold font-body px-4 py-1 rounded-full">
          {t("pricingCard.mostPopular")}
        </div>
      )}
      <div className="text-center">
        <p
          className={`font-heading text-3xl font-bold ${
            tier.popular ? "text-white" : "text-dark"
          }`}
        >
          {tier.followers}
        </p>
        <p
          className={`font-body text-sm mt-1 ${
            tier.popular ? "text-white/80" : "text-gray-text"
          }`}
        >
          {t("pricingCard.audienceReach")}
        </p>
        <div className="mt-4">
          {tier.originalPrice && (
            <span
              className={`font-body text-sm line-through mr-2 ${
                tier.popular ? "text-white/60" : "text-gray-400"
              }`}
            >
              ${tier.originalPrice}
            </span>
          )}
          <span
            className={`font-heading text-4xl font-bold ${
              tier.popular ? "text-white" : "text-dark"
            }`}
          >
            ${tier.price}
          </span>
        </div>
      </div>
      <button
        className={`mt-6 w-full py-3 rounded-full font-body text-sm font-semibold transition-all duration-300 ${
          tier.popular
            ? "bg-white text-dark hover:bg-gray-100"
            : "bg-gradient-to-r " +
              gradientClass +
              " text-white hover:opacity-90"
        }`}
      >
        {t("pricingCard.activate")}
      </button>
    </div>
  );
}
