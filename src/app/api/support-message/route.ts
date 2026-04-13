import { NextRequest, NextResponse } from "next/server";

const DISCORD_SUPPORT_WEBHOOK_URL = process.env.DISCORD_SUPPORT_WEBHOOK_URL;

interface SupportPayload {
  name?: string;
  email: string;
  orderId?: string;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, orderId, message } = (await req.json()) as SupportPayload;

    // Validation
    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (!DISCORD_SUPPORT_WEBHOOK_URL) {
      console.error("[Support] DISCORD_SUPPORT_WEBHOOK_URL is not configured");
      return NextResponse.json(
        { error: "Support system is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(DISCORD_SUPPORT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Reachopia Support",
        avatar_url: "https://reachopia.com/logo.png",
        embeds: [
          {
            title: "📩 Nouvelle demande de support client",
            color: 0x3b82f6, // Blue
            fields: [
              ...(name ? [{ name: "👤 Name", value: name, inline: true }] : []),
              {
                name: "📧 Email",
                value: email,
                inline: true,
              },
              ...(orderId ? [{ name: "🧾 Order ID", value: orderId, inline: true }] : []),
              {
                name: "💬 Message",
                value:
                  message.length > 1024
                    ? message.slice(0, 1021) + "..."
                    : message,
                inline: false,
              },
            ],
            footer: {
              text: "Reachopia — Support Widget",
            },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(
        `[Support] Discord webhook failed: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        { error: "Failed to send message. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Support] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
