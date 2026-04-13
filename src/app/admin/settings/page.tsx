"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Loader2, Save, Eye, EyeOff, Zap } from "lucide-react";

interface AnnouncementBarSettings {
  enabled: boolean;
  text: string;
  highlightText: string;
  ctaText: string;
  ctaLink: string;
}

interface BFServiceIds {
  tiktok_followers: number;
  tiktok_likes: number;
  tiktok_views: number;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AnnouncementBarSettings>({
    enabled: true,
    text: "50% OFF on all AI Growth Packs today!",
    highlightText: "Flash Sale:",
    ctaText: "Claim offer →",
    ctaLink: "/pricing",
  });
  const [bfIds, setBfIds] = useState<BFServiceIds>({
    tiktok_followers: 14270,
    tiktok_likes: 14256,
    tiktok_views: 640,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBf, setSavingBf] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [bfMessage, setBfMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      try {
        const [annRes, bfRes] = await Promise.all([
          fetch("/api/admin/announcement-bar", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/admin/bf-services", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (annRes.ok) {
          const data = await annRes.json();
          setSettings(data);
        }
        if (bfRes.ok) {
          const data = await bfRes.json();
          setBfIds(data);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/announcement-bar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Settings saved successfully!" });
      } else {
        setMessage({ type: "error", text: "Failed to save settings" });
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBf = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setSavingBf(true);
    setBfMessage(null);

    try {
      const res = await fetch("/api/admin/bf-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bfIds),
      });

      if (res.ok) {
        setBfMessage({ type: "success", text: "BulkFollows service IDs saved!" });
      } else {
        const data = await res.json();
        setBfMessage({ type: "error", text: data.error || "Failed to save" });
      }
    } catch (err) {
      console.error("Failed to save BF IDs:", err);
      setBfMessage({ type: "error", text: "Failed to save BF service IDs" });
    } finally {
      setSavingBf(false);
    }
  };

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">Manage site-wide settings</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Announcement Bar Section */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Announcement Bar</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Configure the promotional banner displayed at the top of the site
                  </p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    settings.enabled
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {settings.enabled ? (
                    <>
                      <Eye className="w-4 h-4" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Disabled
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Highlight Text (colored)
                  </label>
                  <input
                    type="text"
                    value={settings.highlightText}
                    onChange={(e) => setSettings({ ...settings, highlightText: e.target.value })}
                    placeholder="Flash Sale:"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Main Text
                  </label>
                  <input
                    type="text"
                    value={settings.text}
                    onChange={(e) => setSettings({ ...settings, text: e.target.value })}
                    placeholder="50% OFF on all AI Growth Packs today!"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={settings.ctaText}
                      onChange={(e) => setSettings({ ...settings, ctaText: e.target.value })}
                      placeholder="Claim offer →"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      CTA Link
                    </label>
                    <input
                      type="text"
                      value={settings.ctaLink}
                      onChange={(e) => setSettings({ ...settings, ctaLink: e.target.value })}
                      placeholder="/pricing"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-sm font-medium text-gray-400 mb-3">Preview:</p>
                  <div className="bg-zinc-950 border border-white/10 rounded-xl p-3">
                    <div className="flex items-center justify-center gap-3 text-sm">
                      <span className="text-indigo-400">🔥</span>
                      <span className="text-zinc-200">
                        <span className="font-semibold text-indigo-400">{settings.highlightText}</span>{" "}
                        {settings.text}
                      </span>
                      <span className="text-indigo-300 underline">{settings.ctaText}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Announcement Button */}
            <div className="flex items-center justify-between">
              {message && (
                <p
                  className={`text-sm ${
                    message.type === "success" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {message.text}
                </p>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="ml-auto flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>

            {/* BulkFollows Service IDs Section */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">BulkFollows Service IDs</h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Configure the service IDs used when placing orders on BulkFollows
                  </p>
                </div>
              </div>

              {/* TikTok */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ee1d52]" />
                  TikTok
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {(["tiktok_followers", "tiktok_likes", "tiktok_views"] as const).map((key) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 capitalize">
                        {key.replace("tiktok_", "")}
                      </label>
                      <input
                        type="number"
                        value={bfIds[key]}
                        onChange={(e) => setBfIds({ ...bfIds, [key]: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm placeholder:text-gray-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>


              {/* Save BF Button */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                {bfMessage && (
                  <p className={`text-sm ${bfMessage.type === "success" ? "text-green-400" : "text-red-400"}`}>
                    {bfMessage.text}
                  </p>
                )}
                <button
                  onClick={handleSaveBf}
                  disabled={savingBf}
                  className="ml-auto flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-all disabled:opacity-50"
                >
                  {savingBf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Service IDs
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
