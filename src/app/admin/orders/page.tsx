"use client";

import { useEffect, useState, useMemo } from "react";
import AdminShell from "@/components/admin/AdminShell";
import {
  Package,
  Loader2,
  Search,
  Music,
  Hash,
  User,
  Calendar,
  ChevronDown,
  Save,
  MessageSquare,
  Heart,
  Eye,
  Users,
  ExternalLink,
  Zap,
} from "lucide-react";
import GmailPrivateAccountButton from "@/components/admin/GmailPrivateAccountButton";
import GmailUsernameNotFoundButton from "@/components/admin/GmailUsernameNotFoundButton";

interface Assignment {
  postId: string;
  quantity: number;
  imageUrl?: string;
}

interface Order {
  id: number;
  order_id: string;
  username: string;
  email: string | null;
  platform: string;
  service: string;
  followers: number;
  likes_qty: number;
  views_qty: number;
  assignments: {
    likes?: Assignment[];
    views?: Assignment[];
  };
  price: number;
  amount: number;
  cost: number;
  currency: string;
  order_status: string;
  notes: string;
  created_at: string;
  provider_orders?: Array<{
    type: string;
    serviceId: number;
    bfOrderId: number | null;
    link: string;
    quantity: number;
    error?: string;
    status?: string;
  }>;
  customer_total_orders?: number;
  customer_order_number?: number;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-yellow-500/20 text-yellow-400" },
  { value: "processing", label: "Processing", color: "bg-blue-500/20 text-blue-400" },
  { value: "completed", label: "Completed", color: "bg-green-500/20 text-green-400" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500/20 text-red-400" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  const [editingBfId, setEditingBfId] = useState<{ orderId: string; dbId: number; subType: string; subIndex: number } | null>(null);
  const [tempBfId, setTempBfId] = useState("");
  const [addingBfType, setAddingBfType] = useState<{ orderId: string; dbId: number } | null>(null);
  const [newBfType, setNewBfType] = useState("followers");
  const [newBfId, setNewBfId] = useState("");

  const getToken = () => localStorage.getItem("adminToken");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/admin/orders/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ orderId, orderStatus: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, order_status: newStatus } : o
          )
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async (orderId: number) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/admin/orders/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ orderId, notes: tempNotes }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, notes: tempNotes } : o
          )
        );
        setEditingNotes(null);
      }
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveBfId = async (orderIdStr: string, dbId: number, subType: string, subIndex: number, bfId: string) => {
    const parsed = parseInt(bfId, 10);
    if (!parsed || parsed <= 0) return;
    setUpdatingId(dbId);
    try {
      const res = await fetch("/api/admin/orders/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          orderId: dbId,
          providerLink: { subType, subIndex, bfOrderId: parsed },
        }),
      });
      if (res.ok) {
        await fetchOrders();
      }
    } catch (err) {
      console.error("Failed to link BF ID:", err);
    } finally {
      setUpdatingId(null);
      setEditingBfId(null);
      setAddingBfType(null);
      setTempBfId("");
      setNewBfId("");
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        !search ||
        o.username.toLowerCase().includes(search.toLowerCase()) ||
        o.order_id.toLowerCase().includes(search.toLowerCase()) ||
        (o.email && o.email.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus =
        statusFilter === "all" || o.order_status === statusFilter;
      const matchesPlatform =
        platformFilter === "all" || o.platform === platformFilter;
      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [orders, search, statusFilter, platformFilter]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatAmount = (amount: number, currency: string = "EUR") => {
    try {
      return new Intl.NumberFormat("en-US", { 
        style: "currency", 
        currency: currency.toUpperCase() 
      }).format(amount);
    } catch {
      return new Intl.NumberFormat("en-US", { 
        style: "currency", 
        currency: "EUR" 
      }).format(amount);
    }
  };

  const getCustomerStatus = (order: Order): { label: string; isNew: boolean } => {
    const orderNum = order.customer_order_number ?? 1;
    return orderNum === 1 
      ? { label: "Nouveau client", isNew: true }
      : { label: "Récurrent", isNew: false };
  };

  const getStatusStyle = (status: string) =>
    STATUS_OPTIONS.find((s) => s.value === status)?.color ||
    "bg-gray-500/20 text-gray-400";

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Order Management</h1>
          <p className="text-gray-400 mt-1">
            View and manage all customer orders
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username, email, or order ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all" className="bg-gray-900">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value} className="bg-gray-900">
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all" className="bg-gray-900">All Platforms</option>
            <option value="tiktok" className="bg-gray-900">TikTok</option>
          </select>
        </div>

        {/* Results count */}
        <p className="text-gray-500 text-sm mb-4">
          {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""} found
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-5 py-16 text-center">
                        <Package className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500">No orders found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-white text-sm">
                            <Hash className="w-3.5 h-3.5 text-gray-500" />
                            <span className="font-mono text-xs">
                              {order.order_id}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <a
                            href={`https://www.tiktok.com/@${order.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-white text-sm hover:text-indigo-400 transition-colors"
                          >
                            <User className="w-3.5 h-3.5 text-gray-500" />
                            @{order.username}
                          </a>
                          {order.email && (
                            <p className="text-xs text-gray-500 mt-0.5 ml-5">
                              {order.email}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {(() => {
                            const status = getCustomerStatus(order);
                            return (
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  status.isNew
                                    ? "bg-gray-500/20 text-gray-400"
                                    : "bg-green-500/20 text-green-400"
                                }`}
                              >
                                {status.label}
                                {!status.isNew && order.customer_total_orders && (
                                  <span className="ml-1 text-[10px] opacity-70">
                                    #{order.customer_total_orders}
                                  </span>
                                )}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4 text-cyan-400" />
                            <div>
                              <span className="text-sm font-medium text-cyan-400">
                                TikTok
                              </span>
                              <div className="space-y-0.5 mt-0.5">
                                {order.followers > 0 && (
                                  <p className="flex items-center gap-1 text-xs text-gray-400">
                                    <Users className="w-3 h-3 text-gray-500" />
                                    +{order.followers.toLocaleString()} followers
                                  </p>
                                )}
                                {(order.likes_qty ?? 0) > 0 && (
                                  <div>
                                    <p className="flex items-center gap-1 text-xs text-gray-400">
                                      <Heart className="w-3 h-3 text-pink-400" />
                                      +{order.likes_qty.toLocaleString()} likes
                                      {order.assignments?.likes && order.assignments.likes.length > 0 && (
                                        <span className="text-gray-600">({order.assignments.likes.length} videos)</span>
                                      )}
                                    </p>
                                    {order.assignments?.likes && order.assignments.likes.length > 0 && (
                                      <div className="ml-4 mt-1 space-y-0.5">
                                        {order.assignments.likes.map((a, idx) => (
                                          <a
                                            key={idx}
                                            href={`https://www.tiktok.com/@${order.username}/video/${a.postId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-pink-400 transition-colors"
                                          >
                                            <ExternalLink className="w-2.5 h-2.5" />
                                            <span className="font-mono truncate max-w-[100px]">{a.postId}</span>
                                            <span className="text-gray-600">({a.quantity.toLocaleString()})</span>
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {(order.views_qty ?? 0) > 0 && (
                                  <div>
                                    <p className="flex items-center gap-1 text-xs text-gray-400">
                                      <Eye className="w-3 h-3 text-purple-400" />
                                      +{order.views_qty.toLocaleString()} views
                                      {order.assignments?.views && order.assignments.views.length > 0 && (
                                        <span className="text-gray-600">({order.assignments.views.length} videos)</span>
                                      )}
                                    </p>
                                    {order.assignments?.views && order.assignments.views.length > 0 && (
                                      <div className="ml-4 mt-1 space-y-0.5">
                                        {order.assignments.views.map((a, idx) => (
                                          <a
                                            key={idx}
                                            href={`https://www.tiktok.com/@${order.username}/video/${a.postId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-purple-400 transition-colors"
                                          >
                                            <ExternalLink className="w-2.5 h-2.5" />
                                            <span className="font-mono truncate max-w-[100px]">{a.postId}</span>
                                            <span className="text-gray-600">({a.quantity.toLocaleString()})</span>
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {order.followers === 0 && !(order.likes_qty > 0) && !(order.views_qty > 0) && (
                                  <p className="text-xs text-gray-500">{order.service}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-white font-semibold text-sm">
                          {formatAmount(order.amount, order.currency || "EUR")}
                        </td>
                        <td className="px-5 py-4">
                          <div className="relative">
                            {updatingId === order.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                            ) : (
                              <div className="relative">
                                <select
                                  value={order.order_status}
                                  onChange={(e) =>
                                    handleStatusChange(order.id, e.target.value)
                                  }
                                  className={`appearance-none cursor-pointer px-3 py-1 text-xs font-semibold rounded-full border-0 pr-7 ${getStatusStyle(order.order_status)} bg-transparent focus:outline-none`}
                                >
                                  {STATUS_OPTIONS.map((s) => (
                                    <option
                                      key={s.value}
                                      value={s.value}
                                      className="bg-gray-900 text-white"
                                    >
                                      {s.label}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {order.provider_orders && order.provider_orders.length > 0 ? (
                            <div className="space-y-1.5">
                              {order.provider_orders.map((po, idx) => {
                                const typeIndex = order.provider_orders!
                                  .slice(0, idx)
                                  .filter((p) => p.type === po.type).length;
                                const isEditing =
                                  editingBfId?.orderId === order.order_id &&
                                  editingBfId?.subType === po.type &&
                                  editingBfId?.subIndex === typeIndex;

                                return (
                                  <div key={idx}>
                                    <div className="flex items-center gap-1.5">
                                      <Zap className={`w-3 h-3 flex-shrink-0 ${po.bfOrderId ? 'text-emerald-400' : 'text-red-400'}`} />
                                      <span className="text-[10px] text-gray-400">{po.type}</span>
                                      {isEditing ? (
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            value={tempBfId}
                                            onChange={(e) => setTempBfId(e.target.value)}
                                            placeholder="BF ID"
                                            className="w-20 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white text-[10px] font-mono focus:outline-none focus:border-indigo-500"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") handleSaveBfId(order.order_id, order.id, po.type, typeIndex, tempBfId);
                                              if (e.key === "Escape") setEditingBfId(null);
                                            }}
                                          />
                                          <button
                                            onClick={() => handleSaveBfId(order.order_id, order.id, po.type, typeIndex, tempBfId)}
                                            className="p-0.5 hover:bg-white/10 rounded"
                                          >
                                            <Save className="w-2.5 h-2.5 text-green-400" />
                                          </button>
                                        </div>
                                      ) : po.bfOrderId ? (
                                        <button
                                          onClick={() => {
                                            setEditingBfId({ orderId: order.order_id, dbId: order.id, subType: po.type, subIndex: typeIndex });
                                            setTempBfId(String(po.bfOrderId));
                                          }}
                                          className="text-[10px] font-mono text-emerald-400 hover:underline cursor-pointer"
                                          title="Click to edit BF ID"
                                        >
                                          #{po.bfOrderId}
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setEditingBfId({ orderId: order.order_id, dbId: order.id, subType: po.type, subIndex: typeIndex });
                                            setTempBfId("");
                                          }}
                                          className="text-[10px] font-semibold text-red-400 hover:text-red-300 cursor-pointer"
                                          title="Click to add BF ID manually"
                                        >
                                          FAILED → Link
                                        </button>
                                      )}
                                    </div>
                                    {po.error && !po.bfOrderId && !isEditing && (
                                      <p className="ml-[18px] text-[9px] text-red-400/70 max-w-[150px] truncate" title={po.error}>
                                        {po.error}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div>
                              {addingBfType?.orderId === order.order_id ? (
                                <div className="space-y-1">
                                  <select
                                    value={newBfType}
                                    onChange={(e) => setNewBfType(e.target.value)}
                                    className="w-full px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white text-[10px] focus:outline-none focus:border-indigo-500 appearance-none"
                                  >
                                    <option value="followers" className="bg-gray-900">followers</option>
                                    <option value="likes" className="bg-gray-900">likes</option>
                                    <option value="views" className="bg-gray-900">views</option>
                                  </select>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={newBfId}
                                      onChange={(e) => setNewBfId(e.target.value)}
                                      placeholder="BF ID"
                                      className="w-20 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white text-[10px] font-mono focus:outline-none focus:border-indigo-500"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSaveBfId(order.order_id, order.id, newBfType, 0, newBfId);
                                        if (e.key === "Escape") setAddingBfType(null);
                                      }}
                                    />
                                    <button
                                      onClick={() => handleSaveBfId(order.order_id, order.id, newBfType, 0, newBfId)}
                                      className="p-0.5 hover:bg-white/10 rounded"
                                    >
                                      <Save className="w-2.5 h-2.5 text-green-400" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setAddingBfType({ orderId: order.order_id, dbId: order.id });
                                    setNewBfType("followers");
                                    setNewBfId("");
                                  }}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                                >
                                  + Add BF ID
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {editingNotes === order.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={tempNotes}
                                onChange={(e) => setTempNotes(e.target.value)}
                                className="w-32 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveNotes(order.id);
                                  if (e.key === "Escape") setEditingNotes(null);
                                }}
                              />
                              <button
                                onClick={() => handleSaveNotes(order.id)}
                                className="p-1 hover:bg-white/10 rounded"
                              >
                                <Save className="w-3 h-3 text-green-400" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingNotes(order.id);
                                setTempNotes(order.notes || "");
                              }}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                            >
                              <MessageSquare className="w-3 h-3" />
                              {order.notes
                                ? order.notes.length > 20
                                  ? order.notes.slice(0, 20) + "..."
                                  : order.notes
                                : "Add note"}
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(order.created_at)}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {order.email && (
                            <div className="flex items-center gap-2">
                              <GmailPrivateAccountButton
                                customerEmail={order.email}
                                orderId={order.order_id}
                                username={order.username}
                                platform={order.platform}
                              />
                              <GmailUsernameNotFoundButton
                                customerEmail={order.email}
                                orderId={order.order_id}
                                username={order.username}
                                platform={order.platform}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
