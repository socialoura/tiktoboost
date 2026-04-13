"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package,
  Clock,
  CheckCircle2,
  Loader2,
  ArrowRight,
  RefreshCw,
  Users,
  Heart,
  Eye,
  TrendingUp,
  Zap,
  Mail,
  ChevronDown,
  Shield,
} from "lucide-react";
import { useTranslation } from "@/context/TranslationContext";

/* ─── Types ─── */
interface SubOrder {
  type: string;
  quantity: number;
  bfOrderId: number | null;
  status: string;
  delivered: number;
  remains: number;
}

interface DashboardOrder {
  orderId: string;
  username: string;
  platform: string;
  service: string;
  followers: number;
  likesQty: number;
  viewsQty: number;
  orderStatus: string;
  createdAt: string;
  progressPct: number;
  totalDelivered: number;
  totalOrdered: number;
  subOrders: SubOrder[];
}

/* ─── Platform SVG Icons ─── */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16.6 5.82A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
    </svg>
  );
}


/* ─── Status Config ─── */
const STATUS_STYLE: Record<string, { key: string; color: string; bg: string; dot: string }> = {
  completed:     { key: "dashboard.statusCompleted",  color: "text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-400" },
  "Completed":   { key: "dashboard.statusCompleted",  color: "text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-400" },
  pending:       { key: "dashboard.statusProcessing", color: "text-amber-400",   bg: "bg-amber-500/10",   dot: "bg-amber-400"   },
  "Pending":     { key: "dashboard.statusProcessing", color: "text-amber-400",   bg: "bg-amber-500/10",   dot: "bg-amber-400"   },
  "Processing":  { key: "dashboard.statusProcessing", color: "text-amber-400",   bg: "bg-amber-500/10",   dot: "bg-amber-400"   },
  "In progress": { key: "dashboard.statusInProgress", color: "text-blue-400",    bg: "bg-blue-500/10",    dot: "bg-blue-400"    },
};

function getStatusStyle(status: string) {
  return STATUS_STYLE[status] || { key: "", color: "text-zinc-400", bg: "bg-zinc-500/10", dot: "bg-zinc-400" };
}

function getTypeIcon(type: string) {
  if (type === "followers") return Users;
  if (type === "likes") return Heart;
  if (type === "views") return Eye;
  return Package;
}

function getTypeColor(type: string) {
  if (type === "followers") return { text: "text-violet-400", bg: "bg-violet-500/10" };
  if (type === "likes") return { text: "text-pink-400", bg: "bg-pink-500/10" };
  if (type === "views") return { text: "text-sky-400", bg: "bg-sky-500/10" };
  return { text: "text-zinc-400", bg: "bg-zinc-500/10" };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─── Circular Progress Ring ─── */
function ProgressRing({ pct, size = 52, stroke = 4, color }: { pct: number; size?: number; stroke?: number; color: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold text-white">{pct}%</span>
      </div>
    </div>
  );
}

/* ─── Stats Summary Bar ─── */
function StatsSummary({ orders }: { orders: DashboardOrder[] }) {
  const { t } = useTranslation();
  const totalOrdered = orders.reduce((sum, o) => sum + o.totalOrdered, 0);
  const totalDelivered = orders.reduce((sum, o) => sum + o.totalDelivered, 0);
  const activeCount = orders.filter(o => o.orderStatus !== "completed" && o.progressPct < 100).length;

  const stats = [
    { label: t("dashboard.statTotalOrders"), value: orders.length, icon: Package, color: "text-white" },
    { label: t("dashboard.statActive"), value: activeCount, icon: Zap, color: "text-blue-400" },
    { label: t("dashboard.statDelivered"), value: totalDelivered.toLocaleString(), icon: TrendingUp, color: "text-emerald-400" },
    { label: t("dashboard.statOrdered"), value: totalOrdered.toLocaleString(), icon: Users, color: "text-violet-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</span>
          </div>
          <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Order Card ─── */
function OrderCard({ order, index }: { order: DashboardOrder; index: number }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const platformLabel = "TikTok";
  const accentColor = "#ee1d52";
  const gradientFrom = "from-cyan-400";
  const gradientTo = "to-blue-600";

  const overallStatus = order.subOrders.length > 0
    ? order.subOrders.every(s => s.status === "Completed") ? "Completed"
      : order.subOrders.some(s => s.status === "In progress") ? "In progress"
      : order.subOrders.some(s => s.status === "Processing") ? "Processing"
      : order.orderStatus
    : order.orderStatus;

  const statusStyle = getStatusStyle(overallStatus);
  const statusLabel = statusStyle.key ? t(statusStyle.key) : overallStatus;
  const { color: statusColor, bg: statusBg, dot: statusDot } = statusStyle;
  const isActive = overallStatus !== "Completed" && overallStatus !== "completed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * index, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
      className="group relative"
    >
      {/* Glow effect for active orders */}
      {isActive && (
        <div
          className="absolute -inset-px rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
          style={{ background: `linear-gradient(135deg, ${accentColor}20, transparent 60%)` }}
        />
      )}

      <div className="relative rounded-[18px] border border-white/[0.06] bg-zinc-950/80 backdrop-blur-sm overflow-hidden hover:border-white/[0.1] transition-all duration-300">
        {/* Top accent line */}
        <div className={`h-[2px] bg-gradient-to-r ${gradientFrom} ${gradientTo} ${isActive ? "opacity-60" : "opacity-20"}`} />

        <div className="p-5 sm:p-6">
          {/* Header row */}
          <div className="flex items-center gap-4">
            {/* Progress ring */}
            <ProgressRing pct={order.progressPct} color={accentColor} />

            {/* Order info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 flex items-center justify-center">
                  <TikTokIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-semibold text-[15px] truncate">@{order.username}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <span>{platformLabel}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span>{formatDate(order.createdAt)}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span>{formatTime(order.createdAt)}</span>
              </div>
            </div>

            {/* Status badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusBg}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${statusDot} ${isActive ? "animate-pulse" : ""}`} />
              <span className={`text-[11px] font-semibold ${statusColor}`}>{statusLabel}</span>
            </div>
          </div>

          {/* Delivery stats */}
          <div className="mt-5 flex items-center gap-6">
            {order.totalOrdered > 0 && (
              <>
                <div>
                  <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider mb-0.5">{t("dashboard.delivered")}</p>
                  <p className="text-[15px] font-bold text-white">{order.totalDelivered.toLocaleString()}</p>
                </div>
                <div className="w-px h-8 bg-white/[0.06]" />
                <div>
                  <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider mb-0.5">{t("dashboard.totalLabel")}</p>
                  <p className="text-[15px] font-bold text-zinc-400">{order.totalOrdered.toLocaleString()}</p>
                </div>
                <div className="w-px h-8 bg-white/[0.06]" />
                <div>
                  <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider mb-0.5">{t("dashboard.remaining")}</p>
                  <p className="text-[15px] font-bold text-zinc-500">{(order.totalOrdered - order.totalDelivered).toLocaleString()}</p>
                </div>
              </>
            )}
          </div>

          {/* Full-width progress bar */}
          <div className="mt-4">
            <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${order.progressPct}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.06 * index }}
                className={`h-full rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo}`}
              />
            </div>
          </div>

          {/* Sub-orders (expandable) */}
          {order.subOrders.length > 1 && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-4 flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                {expanded ? t("dashboard.hideServices") : t("dashboard.showServices")} {order.subOrders.length} {t("dashboard.services")}
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {order.subOrders.map((sub, idx) => {
                        const TypeIcon = getTypeIcon(sub.type);
                        const typeColor = getTypeColor(sub.type);
                        const subPct = sub.quantity > 0 ? Math.min(100, Math.round((sub.delivered / sub.quantity) * 100)) : 0;

                        return (
                          <div key={idx} className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] px-3.5 py-3">
                            <div className={`w-8 h-8 rounded-lg ${typeColor.bg} flex items-center justify-center flex-shrink-0`}>
                              <TypeIcon className={`w-3.5 h-3.5 ${typeColor.text}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-zinc-200 capitalize">{sub.type}</span>
                                <span className="text-[10px] font-bold text-white">{subPct}%</span>
                              </div>
                              <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo} transition-all duration-700`}
                                  style={{ width: `${subPct}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-zinc-600 mt-1">{sub.delivered.toLocaleString()} / {sub.quantity.toLocaleString()} {t("dashboard.subOrderDelivered")}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Single sub-order inline */}
          {order.subOrders.length === 1 && (
            <div className="mt-4 flex items-center gap-2">
              {order.subOrders.map((sub, idx) => {
                const TypeIcon = getTypeIcon(sub.type);
                const typeColor = getTypeColor(sub.type);
                return (
                  <div key={idx} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${typeColor.bg}`}>
                    <TypeIcon className={`w-3 h-3 ${typeColor.text}`} />
                    <span className="text-[11px] font-medium text-zinc-300 capitalize">{sub.type}</span>
                    <span className="text-[10px] text-zinc-500">{sub.delivered.toLocaleString()}/{sub.quantity.toLocaleString()} {t("dashboard.subOrderDelivered")}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* No sub-orders fallback */}
          {order.subOrders.length === 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {order.followers > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10">
                  <Users className="w-3 h-3 text-violet-400" />
                  <span className="text-[11px] font-medium text-zinc-300">{order.followers.toLocaleString()} {t("configurator.followers")}</span>
                </div>
              )}
              {order.likesQty > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/10">
                  <Heart className="w-3 h-3 text-pink-400" />
                  <span className="text-[11px] font-medium text-zinc-300">{order.likesQty.toLocaleString()} {t("configurator.likes")}</span>
                </div>
              )}
              {order.viewsQty > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10">
                  <Eye className="w-3 h-3 text-sky-400" />
                  <span className="text-[11px] font-medium text-zinc-300">{order.viewsQty.toLocaleString()} {t("configurator.views")}</span>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
            <p className="text-[10px] text-zinc-600 font-mono">#{order.orderId}</p>
            <p className="text-[10px] text-zinc-600">{order.service}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Dashboard Content ─── */
function DashboardContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<DashboardOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [activeEmail, setActiveEmail] = useState("");

  const fetchOrders = useCallback(async (emailToFetch: string) => {
    const normalized = emailToFetch.trim().toLowerCase();
    if (!normalized) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/dashboard/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });

      if (!res.ok) {
        setError(t("dashboard.errorGeneric"));
        return;
      }

      const data = await res.json();
      setOrders(data.orders);
      setActiveEmail(normalized);
    } catch {
      setError(t("dashboard.errorNetwork"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const urlEmail = searchParams.get("email");
    if (urlEmail) {
      setEmail(urlEmail);
      fetchOrders(urlEmail);
    }
  }, [searchParams, fetchOrders]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(email);
  };

  const handleRefresh = async () => {
    if (!activeEmail || refreshing) return;
    setRefreshing(true);
    await fetchOrders(activeEmail);
    setRefreshing(false);
  };

  const activeOrders = orders?.filter(o => o.orderStatus !== "completed" && o.progressPct < 100) || [];
  const completedOrders = orders?.filter(o => o.orderStatus === "completed" || o.progressPct >= 100) || [];

  return (
    <div className="min-h-screen bg-black">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(ellipse, #dd2a7b, transparent 70%)" }} />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[400px] h-[300px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(ellipse, #69C9D0, transparent 70%)" }} />

        <div className="relative max-w-2xl mx-auto px-5 pt-32 sm:pt-36 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">{t("dashboard.liveTracking")}</span>
            </div>

            <h1 className="text-[clamp(1.8rem,5vw,3rem)] font-bold text-white mb-4 tracking-tight leading-[1.1]">
              {t("dashboard.heroTitle")}<br />
              <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-cyan-400 bg-clip-text text-transparent">
                {t("dashboard.campaignProgress")}
              </span>
            </h1>

            <p className="text-zinc-500 text-[14px] sm:text-[15px] max-w-sm mx-auto leading-relaxed">
              {t("dashboard.heroSubtitleAlt")}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 pb-24">
        {/* ── Search Form ── */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          onSubmit={handleSubmit}
          className="relative mb-10"
        >
          <div className="relative group">
            {/* Glow on focus */}
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-pink-500/20 via-transparent to-cyan-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />

            <div className="relative flex items-center gap-2 bg-zinc-950 border border-white/[0.08] rounded-2xl p-2 group-focus-within:border-white/[0.15] transition-all">
              <div className="pl-3">
                <Mail className="w-4 h-4 text-zinc-600" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("dashboard.emailPlaceholder")}
                required
                className="flex-1 bg-transparent text-white text-[14px] placeholder:text-zinc-600 outline-none py-3"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-zinc-100 active:scale-[0.97] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {t("dashboard.trackButton")}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-xs mt-3 pl-4"
            >
              {error}
            </motion.p>
          )}

          {/* Trust line */}
          {orders === null && (
            <div className="flex items-center justify-center gap-4 mt-6 text-[10px] text-zinc-600">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {t("dashboard.secureLookup")}</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {t("dashboard.realtimeData")}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t("dashboard.updatedEveryRefresh")}</span>
            </div>
          )}
        </motion.form>

        {/* ── Results ── */}
        <AnimatePresence mode="wait">
          {orders !== null && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
            >
              {orders.length === 0 ? (
                /* ── Empty State ── */
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 text-zinc-700" />
                  </div>
                  <p className="text-white font-semibold text-[16px] mb-2">{t("dashboard.noOrdersTitle")}</p>
                  <p className="text-zinc-600 text-[13px] max-w-xs mx-auto">
                    {t("dashboard.noOrdersDesc")}
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* ── Stats Summary ── */}
                  <StatsSummary orders={orders} />

                  {/* ── Toolbar ── */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      <p className="text-zinc-500 text-[12px]">
                        {orders.length} order{orders.length > 1 ? "s" : ""} for{" "}
                        <span className="text-zinc-300 font-medium">{activeEmail}</span>
                      </p>
                    </div>
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
                      {t("dashboard.refreshStatus")}
                    </button>
                  </div>

                  {/* ── Active Orders ── */}
                  {activeOrders.length > 0 && (
                    <div className="mb-10">
                      <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        <h2 className="text-white font-bold text-[14px] uppercase tracking-wider">{t("dashboard.activeCampaigns")}</h2>
                        <div className="flex-1 h-px bg-white/[0.04]" />
                        <span className="text-[11px] text-zinc-600 font-mono">{activeOrders.length}</span>
                      </div>
                      <div className="space-y-4">
                        {activeOrders.map((order, i) => (
                          <OrderCard key={order.orderId} order={order} index={i} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Completed Orders ── */}
                  {completedOrders.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2.5 mb-5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <h2 className="text-zinc-500 font-bold text-[14px] uppercase tracking-wider">{t("dashboard.completedCampaigns")}</h2>
                        <div className="flex-1 h-px bg-white/[0.04]" />
                        <span className="text-[11px] text-zinc-600 font-mono">{completedOrders.length}</span>
                      </div>
                      <div className="space-y-4">
                        {completedOrders.map((order, i) => (
                          <OrderCard key={order.orderId} order={order} index={i} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Export with Suspense for useSearchParams ─── */
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
