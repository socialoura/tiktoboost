import type { OrderPayload } from "./types";
import { formatCurrency } from "./currency";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields: DiscordEmbedField[];
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
  thumbnail?: { url: string };
}

interface DiscordWebhookPayload {
  username?: string;
  avatar_url?: string;
  embeds: DiscordEmbed[];
}

/**
 * Send a Discord alert when BulkFollows orders fail.
 */
export async function sendBulkFollowsAlert(params: {
  orderId: string;
  username: string;
  failures: Array<{ type: string; quantity: number; error?: string }>;
}): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) return;

  const failLines = params.failures
    .map((f) => `• **${f.type}** (${f.quantity}) — \`${f.error || "unknown error"}\``)
    .join("\n");

  const embed: DiscordEmbed = {
    title: "⚠️ BulkFollows — Échec de commande",
    description: `Des sous-commandes ont échoué pour **#${params.orderId}** (@${params.username}).`,
    color: 0xe74c3c, // Red
    fields: [
      {
        name: "📋 Commande",
        value: `\`#${params.orderId}\``,
        inline: true,
      },
      {
        name: "👤 Username",
        value: `\`@${params.username}\``,
        inline: true,
      },
      {
        name: "❌ Erreurs",
        value: failLines,
        inline: false,
      },
    ],
    footer: { text: "Action requise — vérifier manuellement sur BulkFollows" },
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Reachopia Alerts",
        avatar_url: "https://reachopia.com/logo.png",
        embeds: [embed],
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    console.error("[Discord] Failed to send BulkFollows alert:", err);
  }
}

/**
 * Send a Discord alert when a username doesn't exist (order needs manual handling).
 */
export async function sendUsernameNotFoundAlert(params: {
  orderId: string;
  username: string;
  platform: string;
  email: string;
}): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) return;

  const embed: DiscordEmbed = {
    title: "🔍 Username introuvable — Commande en attente",
    description: `Le profil **@${params.username}** n'a pas été trouvé sur TikTok. La commande BulkFollows n'a **pas** été envoyée.`,
    color: 0xf39c12, // Orange
    fields: [
      {
        name: "📋 Commande",
        value: `\`#${params.orderId}\``,
        inline: true,
      },
      {
        name: "👤 Username",
        value: `\`@${params.username}\``,
        inline: true,
      },
      {
        name: "📧 Email client",
        value: params.email,
        inline: true,
      },
    ],
    footer: { text: "Action requise — vérifier le username et traiter manuellement" },
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Reachopia Alerts",
        avatar_url: "https://reachopia.com/logo.png",
        embeds: [embed],
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    console.error("[Discord] Failed to send username-not-found alert:", err);
  }
}

/**
 * Send a Discord alert when an order is queued because a previous order
 * for the same username is still active on BulkFollows.
 */
export async function sendOrderQueuedAlert(params: {
  orderId: string;
  username: string;
  platform: string;
  email: string;
  conflictOrderId: string;
  followersQty: number;
  likesQty: number;
  viewsQty: number;
}): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) return;

  const parts: string[] = [];
  if (params.followersQty > 0) parts.push(`${params.followersQty} followers`);
  if (params.likesQty > 0) parts.push(`${params.likesQty} likes`);
  if (params.viewsQty > 0) parts.push(`${params.viewsQty} views`);

  const embed: DiscordEmbed = {
    title: "⏳ Commande en file d'attente — Conflit BulkFollows",
    description: `La commande **#${params.orderId}** pour **@${params.username}** n'a **pas** été envoyée à BulkFollows car une commande précédente (**#${params.conflictOrderId}**) est encore en cours pour le même profil.`,
    color: 0xe67e22, // Orange
    fields: [
      {
        name: "📋 Nouvelle commande",
        value: `\`#${params.orderId}\``,
        inline: true,
      },
      {
        name: "⚠️ Commande en conflit",
        value: `\`#${params.conflictOrderId}\``,
        inline: true,
      },
      {
        name: "👤 Username",
        value: `\`@${params.username}\``,
        inline: true,
      },
      {
        name: "📦 Services demandés",
        value: parts.join(" + ") || "—",
        inline: false,
      },
      {
        name: "📧 Email client",
        value: params.email,
        inline: true,
      },
    ],
    footer: { text: "Action requise — soumettre manuellement quand la commande précédente sera terminée" },
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Reachopia Alerts",
        avatar_url: "https://reachopia.com/logo.png",
        embeds: [embed],
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    console.error("[Discord] Failed to send order-queued alert:", err);
  }
}

export async function sendDiscordNotification(
  order: OrderPayload
): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn(
      "[Discord] DISCORD_WEBHOOK_URL is not configured — skipping notification."
    );
    return;
  }

  const platformLabel = "TikTok";
  const platformEmoji = "🎵";
  const formattedPrice = formatCurrency(order.price, order.currency ?? "EUR");

  const embed: DiscordEmbed = {
    title: "🎉 Nouvelle Commande Validée !",
    description: `Un client vient de passer commande pour **${order.quantity} ${platformLabel} ${order.service}**.`,
    color: 0x2ecc71, // Green
    fields: [
      {
        name: "📋 Numéro de commande",
        value: `\`#${order.orderId}\``,
        inline: true,
      },
      {
        name: "💰 Montant",
        value: `**${formattedPrice}**`,
        inline: true,
      },
      {
        name: "📦 Service",
        value: `${platformEmoji} ${order.quantity} ${platformLabel} ${order.service}`,
        inline: false,
      },
      {
        name: "👤 Username cible",
        value: `\`@${order.username}\``,
        inline: true,
      },
      {
        name: "📧 Email client",
        value: order.email,
        inline: true,
      },
      {
        name: "🌐 Plateforme",
        value: platformLabel,
        inline: true,
      },
    ],
    footer: {
      text: "Reachopia — Système de commandes",
    },
    timestamp: new Date().toISOString(),
  };

  const payload: DiscordWebhookPayload = {
    username: "Reachopia Orders",
    avatar_url: "https://reachopia.com/logo.png",
    embeds: [embed],
  };

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      console.error(
        `[Discord] Webhook responded with ${response.status}: ${response.statusText}`
      );
    }
  } catch (err) {
    // Never let Discord failure break the order flow
    console.error("[Discord] Failed to send notification:", err);
  }
}
