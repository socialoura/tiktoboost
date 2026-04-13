import { NextRequest, NextResponse } from "next/server";
import {
  updateOrderStatus,
  updateOrderNotes,
  updateOrderCost,
  linkProviderBfOrderId,
  verifyAdminToken,
  extractToken,
} from "@/lib/db";

export async function PUT(req: NextRequest) {
  try {
    if (!verifyAdminToken(extractToken(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, orderStatus, notes, cost, providerLink } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    if (orderStatus !== undefined) {
      const valid = ["pending", "processing", "completed", "cancelled"];
      if (!valid.includes(orderStatus)) {
        return NextResponse.json(
          { error: `Invalid status. Must be: ${valid.join(", ")}` },
          { status: 400 }
        );
      }
      await updateOrderStatus(orderId, orderStatus);
    }

    if (notes !== undefined) {
      await updateOrderNotes(orderId, notes);
    }

    if (cost !== undefined) {
      const parsed = Number(cost);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return NextResponse.json(
          { error: "Invalid cost" },
          { status: 400 }
        );
      }
      await updateOrderCost(orderId, parsed);
    }

    if (providerLink) {
      const { subType, subIndex, bfOrderId } = providerLink;
      if (!subType || typeof subIndex !== "number" || !bfOrderId) {
        return NextResponse.json(
          { error: "providerLink requires subType, subIndex, and bfOrderId" },
          { status: 400 }
        );
      }
      await linkProviderBfOrderId(orderId, subType, subIndex, Number(bfOrderId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Orders Update]", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
