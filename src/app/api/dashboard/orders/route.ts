import { NextRequest, NextResponse } from "next/server";
import { ensureDbReady } from "@/lib/db";
import { neon } from "@neondatabase/serverless";
import { getOrderStatus } from "@/lib/bulkfollows";

function getSql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
  return neon(process.env.DATABASE_URL);
}

interface ProviderOrder {
  type: string;
  serviceId: number;
  bfOrderId: number | null;
  link: string;
  quantity: number;
  error?: string;
  status?: string;
}

interface OrderRow {
  order_id: string;
  username: string;
  platform: string;
  service: string;
  followers: number;
  likes_qty: number;
  views_qty: number;
  order_status: string;
  created_at: string;
  provider_orders: ProviderOrder[];
}

interface SubOrderStatus {
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
  subOrders: SubOrderStatus[];
}

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const email = body?.email;
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    await ensureDbReady();
    const sql = getSql();

    const orders = await sql`
      SELECT order_id, username, platform, service, followers, likes_qty, views_qty,
             order_status, created_at, provider_orders
      FROM orders
      WHERE LOWER(email) = ${normalizedEmail}
      ORDER BY created_at DESC
      LIMIT 50
    ` as unknown as OrderRow[];

    if (orders.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    // Remap BulkFollows statuses for client-facing display.
    // Cancelled / Partial should appear as "In progress" — the client doesn't need to know.
    function clientFacingStatus(bfStatus: string): string {
      const s = bfStatus.toLowerCase();
      if (s === "cancelled" || s === "canceled" || s === "partial") return "In progress";
      return bfStatus;
    }

    // Fetch BulkFollows status for each sub-order
    const dashboardOrders: DashboardOrder[] = [];

    for (const order of orders) {
      // Admin manual override takes priority
      const adminStatus = order.order_status; // e.g. "completed", "pending", "cancelled", "refunded"
      const isAdminCompleted = adminStatus === "completed";
      const isAdminCancelled = adminStatus === "cancelled" || adminStatus === "refunded";

      const subOrders: SubOrderStatus[] = [];
      let totalDelivered = 0;
      let totalOrdered = 0;

      const providerOrders = order.provider_orders || [];

      // If admin marked as completed, skip BulkFollows calls — show 100%
      if (isAdminCompleted) {
        for (const po of providerOrders) {
          totalOrdered += po.quantity;
          totalDelivered += po.quantity;
          subOrders.push({
            type: po.type,
            quantity: po.quantity,
            bfOrderId: po.bfOrderId,
            status: "Completed",
            delivered: po.quantity,
            remains: 0,
          });
        }
      } else if (!isAdminCancelled) {
        // Normal flow: fetch live status from BulkFollows
        for (const po of providerOrders) {
          let status = po.status || "Processing";
          let delivered = 0;
          let remains = po.quantity;

          if (po.bfOrderId) {
            try {
              const bfStatus = await getOrderStatus(po.bfOrderId);
              if (bfStatus.status) {
                status = clientFacingStatus(bfStatus.status);
              }
              if (bfStatus.remains !== undefined) {
                remains = parseInt(String(bfStatus.remains), 10) || 0;
                delivered = po.quantity - remains;
                if (delivered < 0) delivered = 0;
              }
            } catch {
              // If BulkFollows is unreachable, use stored status
            }
          }

          totalDelivered += delivered;
          totalOrdered += po.quantity;

          subOrders.push({
            type: po.type,
            quantity: po.quantity,
            bfOrderId: po.bfOrderId,
            status,
            delivered,
            remains,
          });
        }
      }

      // If no provider orders, use order-level data
      if (providerOrders.length === 0) {
        totalOrdered = order.followers + (order.likes_qty || 0) + (order.views_qty || 0);
        if (isAdminCompleted) {
          totalDelivered = totalOrdered;
        }
      }

      // Skip orders that admin cancelled/refunded — don't show to client
      if (isAdminCancelled) continue;

      // Determine client-facing order status
      const clientOrderStatus = isAdminCompleted ? "completed" : adminStatus;

      const progressPct = totalOrdered > 0
        ? Math.min(100, Math.round((totalDelivered / totalOrdered) * 100))
        : isAdminCompleted ? 100 : 0;

      dashboardOrders.push({
        orderId: order.order_id,
        username: order.username,
        platform: order.platform,
        service: order.service,
        followers: order.followers,
        likesQty: order.likes_qty || 0,
        viewsQty: order.views_qty || 0,
        orderStatus: clientOrderStatus,
        createdAt: order.created_at,
        progressPct,
        totalDelivered,
        totalOrdered,
        subOrders,
      });
    }

    return NextResponse.json({ orders: dashboardOrders });
  } catch (err) {
    console.error("[Dashboard] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
