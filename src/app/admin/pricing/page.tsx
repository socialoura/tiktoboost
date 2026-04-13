"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Loader2, Plus, Trash2, Save, Music, Heart, Eye } from "lucide-react";

interface Tier {
  followers: string;
  price: string;
  prices?: Record<string, string>;
}

const CURRENCIES = [
  { code: "EUR", symbol: "€", label: "EUR" },
] as const;

interface DownsellConfig {
  reachAmount: number;
  price: number;
  currency: string;
  ctaLabel: string;
  enabled: boolean;
  prices?: Record<string, number>;
}

type PlatformKey = "tiktok" | "tiktokLikes" | "tiktokViews";

interface PricingData {
  tiktok: Tier[];
  tiktokLikes?: Tier[];
  tiktokViews?: Tier[];
  downsell?: DownsellConfig;
  popularIndex?: Record<string, number>;
}

const DEFAULT_DOWNSELL: DownsellConfig = {
  reachAmount: 100,
  price: 1.90,
  currency: "€",
  ctaLabel: "Claim My Trial Pack",
  enabled: true,
  prices: { EUR: 1.90 },
};

export default function AdminPricingPage() {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("EUR");

  const getToken = () => localStorage.getItem("adminToken");

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pricing");
      if (res.ok) {
        setPricing(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch pricing:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!pricing) return;
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(pricing),
      });

      if (res.ok) {
        setMessage("Pricing saved successfully!");
      } else {
        setMessage("Failed to save pricing.");
      }
    } catch {
      setMessage("Error saving pricing.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const getTiers = (platform: PlatformKey): Tier[] => {
    if (!pricing) return [];
    return (pricing[platform] ?? []) as Tier[];
  };

  const setTiers = (platform: PlatformKey, tiers: Tier[]) => {
    if (!pricing) return;
    setPricing({ ...pricing, [platform]: tiers });
  };

  const updateTier = (
    platform: PlatformKey,
    index: number,
    field: "followers" | "price",
    value: string
  ) => {
    const tiers = [...getTiers(platform)];
    tiers[index] = { ...tiers[index], [field]: value };
    setTiers(platform, tiers);
  };

  const updateTierCurrencyPrice = (
    platform: PlatformKey,
    index: number,
    currencyCode: string,
    value: string
  ) => {
    const tiers = [...getTiers(platform)];
    const tier = { ...tiers[index] };
    tier.prices = { ...(tier.prices || {}), [currencyCode]: value };
    if (currencyCode === "EUR") tier.price = value;
    tiers[index] = tier;
    setTiers(platform, tiers);
  };

  const addTier = (platform: PlatformKey) => {
    const tiers = [...getTiers(platform)];
    tiers.push({ followers: "", price: "", prices: { EUR: "" } });
    setTiers(platform, tiers);
  };

  const removeTier = (platform: PlatformKey, index: number) => {
    const tiers = getTiers(platform).filter((_, i) => i !== index);
    setTiers(platform, tiers);
  };

  const updateDownsell = (field: keyof DownsellConfig, value: string | number | boolean) => {
    if (!pricing) return;
    setPricing({
      ...pricing,
      downsell: { ...(pricing.downsell ?? DEFAULT_DOWNSELL), [field]: value },
    });
  };

  const updateDownsellPrice = (currencyCode: string, value: number) => {
    if (!pricing) return;
    const ds = pricing.downsell ?? DEFAULT_DOWNSELL;
    const updatedPrices = { ...(ds.prices || {}), [currencyCode]: value };
    setPricing({
      ...pricing,
      downsell: {
        ...ds,
        prices: updatedPrices,
        // Keep base price in sync with EUR
        ...(currencyCode === "EUR" ? { price: value } : {}),
      },
    });
  };

  const renderDownsellSection = () => {
    const ds = pricing?.downsell ?? DEFAULT_DOWNSELL;
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <h3 className="text-lg font-semibold text-white">Exit-Intent Downsell</h3>
          </div>
          <button
            onClick={() => updateDownsell("enabled", !ds.enabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${ds.enabled ? "bg-indigo-500" : "bg-white/10"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${ds.enabled ? "translate-x-5" : ""}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Reach Amount</label>
            <input
              type="number"
              value={ds.reachAmount}
              onChange={(e) => updateDownsell("reachAmount", parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">CTA Label</label>
            <input
              type="text"
              value={ds.ctaLabel}
              onChange={(e) => updateDownsell("ctaLabel", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-3">Price per Currency</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {CURRENCIES.map((cur) => {
              const curPrice = ds.prices?.[cur.code] ?? ds.price;
              return (
                <div key={cur.code} className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-semibold">{cur.symbol}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={curPrice}
                    onChange={(e) => updateDownsellPrice(cur.code, parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="block mt-1 text-[10px] text-zinc-600 text-center font-medium">{cur.code}</span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-600">
          Shown when a user tries to close the pricing modal. The trial offer is a last-chance conversion tool.
        </p>
      </div>
    );
  };

  const renderPlatformSection = (
    platform: PlatformKey,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    colorClass: string,
    quantityLabel = "Followers"
  ) => {
    const tiers = getTiers(platform);
    const activeCur = CURRENCIES.find((c) => c.code === selectedCurrency) || CURRENCIES[0];
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Icon className={`w-6 h-6 ${colorClass}`} />
            <h3 className="text-lg font-semibold text-white">{label}</h3>
          </div>
          <button
            onClick={() => addTier(platform)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Tier
          </button>
        </div>


        {/* Popular badge selector */}
        <div className="flex items-center gap-3 mb-4">
          <label className="text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">⭐ Popular badge</label>
          <select
            value={pricing?.popularIndex?.[platform] ?? -1}
            onChange={(e) => {
              if (!pricing) return;
              const val = parseInt(e.target.value);
              setPricing({
                ...pricing,
                popularIndex: {
                  ...(pricing.popularIndex ?? {}),
                  [platform]: val,
                },
              });
            }}
            className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value={-1} className="bg-zinc-900">Auto (middle)</option>
            {tiers.map((tier, i) => (
              <option key={i} value={i} className="bg-zinc-900">
                {tier.followers} {quantityLabel}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_40px] gap-3 px-1">
            <span className="text-xs font-semibold text-gray-500 uppercase">
              {quantityLabel}
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase">
              Price ({activeCur.symbol} {activeCur.code})
            </span>
            <span />
          </div>

          {tiers.map((tier, i) => {
            const curPrice = tier.prices?.["EUR"] ?? tier.price ?? "";
            return (
              <div
                key={i}
                className="grid grid-cols-[1fr_1fr_40px] gap-3 items-center"
              >
                <input
                  type="text"
                  value={tier.followers}
                  onChange={(e) =>
                    updateTier(platform, i, "followers", e.target.value)
                  }
                  placeholder="1000"
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={curPrice}
                  onChange={(e) =>
                    updateTierCurrencyPrice(platform, i, selectedCurrency, e.target.value)
                  }
                  placeholder="9.90"
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={() => removeTier(platform, i)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {tiers.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-6">
              No pricing tiers. Click &quot;Add Tier&quot; to create one.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Pricing Management
            </h1>
            <p className="text-gray-400 mt-1">
              Manage service prices for all platforms. Changes reflect
              instantly on the frontend.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !pricing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>

        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${
              message.includes("success")
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          </div>
        ) : pricing ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderPlatformSection(
              "tiktok",
              "TikTok Followers",
              Music,
              "text-cyan-400",
              "Followers"
            )}
            {renderPlatformSection(
              "tiktokLikes",
              "TikTok Likes",
              Heart,
              "text-rose-400",
              "Likes"
            )}
            {renderPlatformSection(
              "tiktokViews",
              "TikTok Views",
              Eye,
              "text-emerald-400",
              "Views"
            )}
            {renderDownsellSection()}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-24">
            Failed to load pricing data
          </p>
        )}
      </div>
    </AdminShell>
  );
}
