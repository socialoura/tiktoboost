"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import {
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  Loader2,
  Music,
  Globe,
  Calendar,
  Users,
  Target,
  Euro,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface CountryStat {
  country_code: string;
  country_name: string;
  orders: number;
  revenue: number;
}

interface CurrencyStat {
  currency: string;
  orders: number;
  revenue: number;
}

interface DailyStats {
  date: string;
  totalOrders: number;
  totalRevenueEur: number;
  uniqueCustomers: number;
  exitIntentPurchases: number;
  aovEur: number;
  byCurrency: CurrencyStat[];
}

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  last24h: number;
  monthly: Array<{ month: string; orders: number; revenue: number }>;
  byPlatform: Array<{ platform: string; count: number; revenue: number }>;
  byCountry: CountryStat[];
  byCurrency: CurrencyStat[];
}

function countryFlag(code: string): string {
  if (!code || code === "XX") return "\uD83C\uDF10";
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(true);
  const [dailyLoading, setDailyLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      try {
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch daily stats when date changes
  useEffect(() => {
    const fetchDailyStats = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      setDailyLoading(true);
      try {
        const res = await fetch(`/api/admin/stats/daily?date=${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setDailyStats(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch daily stats:", err);
      } finally {
        setDailyLoading(false);
      }
    };

    fetchDailyStats();
  }, [selectedDate]);

  
  const formatMonth = (m: string) => {
    const [year, month] = m.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  };

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">Overview of your business performance</p>
        </div>

        {/* ═══════════ DAILY STATS WITH DATE PICKER ═══════════ */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Daily Performance</h3>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          {dailyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          ) : dailyStats ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Total Revenue EUR */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Euro className="w-4 h-4 text-green-400" />
                    <p className="text-gray-400 text-xs">Revenue (EUR)</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(dailyStats.totalRevenueEur, 'EUR')}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">Converted using daily rates</p>
                </div>

                {/* Orders */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-indigo-400" />
                    <p className="text-gray-400 text-xs">Orders</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{dailyStats.totalOrders}</p>
                </div>

                {/* Unique Customers */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <p className="text-gray-400 text-xs">Unique Customers</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{dailyStats.uniqueCustomers}</p>
                </div>

                {/* AOV */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-yellow-400" />
                    <p className="text-gray-400 text-xs">AOV (EUR)</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(dailyStats.aovEur, 'EUR')}
                  </p>
                </div>

                {/* Exit Intent Purchases */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-orange-400" />
                    <p className="text-gray-400 text-xs">Exit Intent</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{dailyStats.exitIntentPurchases}</p>
                  <p className="text-[10px] text-gray-500 mt-1">Downsell purchases</p>
                </div>
              </div>

              {/* Revenue by Currency breakdown */}
              {dailyStats.byCurrency && dailyStats.byCurrency.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs text-gray-500 mb-2">Revenue breakdown by currency:</p>
                  <div className="flex flex-wrap gap-2">
                    {dailyStats.byCurrency.map((c) => (
                      <span
                        key={c.currency}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-sm"
                      >
                        <span className="font-semibold text-white">
                          {formatCurrency(c.revenue, c.currency)}
                        </span>
                        <span className="text-gray-500">({c.orders})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">No data for this date</p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          </div>
        ) : stats ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Orders</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {stats.totalOrders}
                    </p>
                  </div>
                  <Package className="w-10 h-10 text-indigo-400" />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Revenue</p>
                    {stats.byCurrency && stats.byCurrency.length > 0 ? (
                      <div className="mt-1 space-y-0.5">
                        {stats.byCurrency.map((c) => (
                          <p key={c.currency} className="text-lg font-bold text-white">
                            {formatCurrency(c.revenue, c.currency || "EUR")}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-3xl font-bold text-white mt-1">
                        {formatCurrency(stats.totalRevenue, 'EUR')}
                      </p>
                    )}
                  </div>
                  <DollarSign className="w-10 h-10 text-green-400" />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Today</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {stats.todayOrders}
                    </p>
                  </div>
                  <Clock className="w-10 h-10 text-yellow-400" />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Last 24h</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {stats.last24h}
                    </p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Platform breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {stats.byPlatform.map((p) => (
                <div
                  key={p.platform}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Music className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-white capitalize">
                      {p.platform}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Orders</p>
                      <p className="text-2xl font-bold text-white">{p.count}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Revenue</p>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(p.revenue, 'USD')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Countries by Revenue */}
            {stats.byCountry && stats.byCountry.length > 0 && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Top Countries by Revenue
                  </h3>
                </div>
                <div className="space-y-3">
                  {stats.byCountry.map((c, i) => {
                    const maxRevenue = stats.byCountry[0]?.revenue || 1;
                    const pct = Math.max((c.revenue / maxRevenue) * 100, 2);
                    return (
                      <div key={c.country_code} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg leading-none">{countryFlag(c.country_code)}</span>
                            <span className="text-sm font-medium text-white">{c.country_name}</span>
                            {i === 0 && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                                Top
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-400">{c.orders} orders</span>
                            <span className="font-semibold text-white min-w-[80px] text-right">
                              {formatCurrency(c.revenue, 'USD')}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Monthly chart (bar chart with CSS) */}
            {stats.monthly.length > 0 && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-6">
                  Monthly Revenue
                </h3>
                <div className="flex items-end gap-2 h-48 overflow-x-auto pb-2">
                  {(() => {
                    const maxRevenue = Math.max(
                      ...stats.monthly.map((m) => m.revenue),
                      1
                    );
                    return stats.monthly.map((m) => (
                      <div
                        key={m.month}
                        className="flex flex-col items-center flex-shrink-0 min-w-[60px]"
                      >
                        <span className="text-xs text-gray-400 mb-1">
                          {formatCurrency(m.revenue, 'USD')}
                        </span>
                        <div
                          className="w-10 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all"
                          style={{
                            height: `${Math.max((m.revenue / maxRevenue) * 140, 4)}px`,
                          }}
                        />
                        <span className="text-xs text-gray-500 mt-2">
                          {formatMonth(m.month)}
                        </span>
                        <span className="text-xs text-gray-600">
                          {m.orders} orders
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24">
            <p className="text-gray-400">Failed to load analytics data</p>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
