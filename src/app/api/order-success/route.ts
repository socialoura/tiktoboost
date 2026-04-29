import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import OrderConfirmationEmail from "@/emails/OrderConfirmation";
import { sendDiscordNotification, sendBulkFollowsAlert, sendUsernameNotFoundAlert, sendOrderQueuedAlert } from "@/lib/discord";
import { createOrder, updateProviderOrders, hasActiveBulkFollowsOrder } from "@/lib/db";
import { submitTikTokOrder, verifyTikTokUsername, type ProviderOrder } from "@/lib/bulkfollows";
import { getCountryName } from "@/lib/country-names";
import type { OrderPayload } from "@/lib/types";
import { extractUsername } from "@/lib/extract-username";

// Extend Vercel serverless timeout (default 10s on hobby, up to 60s on pro)
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const body = await req.json();

    const raw = body as OrderPayload;
    const cleanUsername = extractUsername(raw.username);
    const { orderId, email, platform, service, quantity, price, currency, followersQty, likesQty, viewsQty, assignments } = raw;
    const username = cleanUsername || raw.username;

    // Validate required fields
    if (
      !orderId ||
      !email ||
      !username ||
      !platform ||
      !service ||
      !quantity ||
      price == null
    ) {
      return NextResponse.json(
        { error: "Missing required fields in order payload" },
        { status: 400 }
      );
    }

    const order: OrderPayload = {
      orderId,
      email,
      username,
      platform,
      service,
      quantity,
      price,
      currency: currency || "EUR",
    };

    const platformLabel = "TikTok";

    // Extract country from Vercel geo header
    const headersList = await headers();
    const countryCode = headersList.get("x-vercel-ip-country") || undefined;
    const countryName = countryCode ? getCountryName(countryCode) : undefined;

    // 1. Save order to database (critical — don't swallow errors)
    let dbOrderId: number | undefined;
    try {
      const dbResult = await createOrder({
        orderId,
        username,
        email,
        platform,
        service,
        followers: followersQty ?? (parseInt(quantity, 10) || 0),
        likesQty: likesQty ?? 0,
        viewsQty: viewsQty ?? 0,
        assignments: assignments ?? {},
        price,
        currency: currency || "EUR",
        countryCode,
        countryName,
      });
      dbOrderId = dbResult.id;
    } catch (dbErr) {
      console.error("[DB] Failed to save order:", dbErr);
      // Continue with notifications even if DB fails
    }

    // 2. Fire Discord notification IMMEDIATELY (before BulkFollows which can timeout)
    //    Discord failures are caught internally — this never throws.
    await sendDiscordNotification(order);

    // 3. Auto-submit to BulkFollows for TikTok orders
    const fQty = followersQty ?? (parseInt(quantity, 10) || 0);
    const lQty = likesQty ?? 0;
    const vQty = viewsQty ?? 0;
    let providerOrders: ProviderOrder[] = [];
    const bulkFollowsDisabled = process.env.DISABLE_BULKFOLLOWS === "true";
    if (bulkFollowsDisabled) {
      console.log("[BulkFollows] DISABLED via DISABLE_BULKFOLLOWS — skipping auto-submit");
    } else if (platform === "tiktok") {
      // First verify the username actually exists (TikTok only for now)
      let usernameExists = true;
      if (platform === "tiktok") {
        usernameExists = await verifyTikTokUsername(username);
      }

      if (!usernameExists) {
        console.warn(`[BulkFollows] Username @${username} not found — skipping auto-order for ${orderId}`);
        await sendUsernameNotFoundAlert({ orderId, username, platform, email });
      } else {
        // Check for active BulkFollows orders on the same username to avoid conflicts
        const conflict = await hasActiveBulkFollowsOrder(username, platform, orderId);

        if (conflict.active) {
          console.warn(`[BulkFollows] Active order #${conflict.conflictOrderId} exists for @${username} — queuing ${orderId}`);
          await sendOrderQueuedAlert({
            orderId,
            username,
            platform,
            email,
            conflictOrderId: conflict.conflictOrderId!,
            followersQty: fQty,
            likesQty: lQty,
            viewsQty: vQty,
          });
        } else {
          try {
            const submitFn = submitTikTokOrder;
            providerOrders = await submitFn({
              username,
              followersQty: fQty,
              likesQty: lQty,
              viewsQty: vQty,
              assignments,
            });
            // Save provider order IDs back to DB
            if (providerOrders.length > 0) {
              await updateProviderOrders(orderId, providerOrders);
            }
            console.log(`[BulkFollows] Submitted ${providerOrders.length} sub-orders for ${orderId}`);

            // Alert on Discord if any sub-order failed
            const failures = providerOrders.filter((po) => !po.bfOrderId);
            if (failures.length > 0) {
              await sendBulkFollowsAlert({
                orderId,
                username,
                failures: failures.map((f) => ({ type: f.type, quantity: f.quantity, error: f.error })),
              });
            }
          } catch (bfErr) {
            console.error("[BulkFollows] Failed to submit orders:", bfErr);
            await sendBulkFollowsAlert({
              orderId,
              username,
              failures: [{ type: "all", quantity: 0, error: String(bfErr) }],
            });
          }
        }
      }
    }

    // 4. Send confirmation email
    const emailResult = await resend.emails
      .send({
        from: process.env.RESEND_FROM || "TiktoBoost <noreply@tiktoboost.com>",
        to: [email],
        subject: `Order Confirmed — ${quantity} ${platformLabel} ${service} 🎉`,
        react: OrderConfirmationEmail({ order }),
      })
      .then((value) => ({ status: "fulfilled" as const, value }))
      .catch((reason) => ({ status: "rejected" as const, reason }));

    if (emailResult.status === "rejected") {
      console.error("[Resend] Email send failed:", emailResult.reason);
    }

    if (emailResult.status === "fulfilled" && emailResult.value.error) {
      console.error("[Resend] Email error:", emailResult.value.error);
    }

    const emailId =
      emailResult.status === "fulfilled"
        ? emailResult.value.data?.id
        : undefined;

    return NextResponse.json({ success: true, emailId, dbOrderId });
  } catch (err) {
    console.error("[order-success] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
