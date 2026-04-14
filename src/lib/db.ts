import { neon } from "@neondatabase/serverless";

// Lazy-init: avoid crashing at build time when DATABASE_URL is not set
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sql: any;
let _dbInitialized = false;

function getSql() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("[DB] DATABASE_URL environment variable is not set");
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

const sql = new Proxy(function () {} as any, {
  apply(_t, _this, args) {
    return (getSql() as any)(...args);
  },
}) as any;

/** Ensure tables exist. Safe to call multiple times — uses IF NOT EXISTS. */
export async function ensureDbReady() {
  if (_dbInitialized) return;
  try {
    await initDatabase();
    _dbInitialized = true;
  } catch (err) {
    console.error("[DB] Auto-init failed:", err);
  }
}

// ─── Schema Initialization ───────────────────────────────

export async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        platform VARCHAR(50) NOT NULL,
        service VARCHAR(100) NOT NULL DEFAULT 'Followers',
        followers INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        cost DECIMAL(10, 2) DEFAULT 0,
        payment_status VARCHAR(50) DEFAULT 'completed',
        payment_intent_id VARCHAR(255),
        order_status VARCHAR(50) DEFAULT 'pending',
        notes TEXT DEFAULT '',
        country_code VARCHAR(10),
        country_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add country columns to existing tables (safe to run multiple times)
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS country_code VARCHAR(10)`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS country_name VARCHAR(255)`;
    
    // Add currency column for multi-currency support
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD'`;

    // Add likes, views, and assignments columns for bundle orders
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS likes_qty INTEGER DEFAULT 0`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS views_qty INTEGER DEFAULT 0`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS assignments JSONB DEFAULT '{}'::jsonb`;

    // Add provider_orders column for BulkFollows integration
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_orders JSONB DEFAULT '[]'::jsonb`;

    await sql`
      CREATE TABLE IF NOT EXISTS pricing (
        id VARCHAR(50) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_platform ON orders(platform)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status)`;

    console.log("[DB] Database initialized successfully");
  } catch (error) {
    console.error("[DB] Initialization error:", error);
  }
}

// ─── Orders ──────────────────────────────────────────────

export interface DBOrder {
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
    likes?: Array<{ postId: string; quantity: number; imageUrl?: string }>;
    views?: Array<{ postId: string; quantity: number; imageUrl?: string }>;
  };
  price: number;
  amount: number;
  cost: number;
  currency: string;
  payment_status: string;
  payment_intent_id: string | null;
  order_status: string;
  notes: string;
  country_code: string | null;
  country_name: string | null;
  created_at: string;
  updated_at: string;
  provider_orders: Array<{
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

export async function createOrder(data: {
  orderId: string;
  username: string;
  email: string;
  platform: string;
  service: string;
  followers: number;
  likesQty?: number;
  viewsQty?: number;
  assignments?: {
    likes?: Array<{ postId: string; quantity: number; imageUrl?: string }>;
    views?: Array<{ postId: string; quantity: number; imageUrl?: string }>;
  };
  price: number;
  currency?: string;
  paymentIntentId?: string;
  countryCode?: string;
  countryName?: string;
}): Promise<{ id: number; order_id: string }> {
  await ensureDbReady();
  const assignmentsJson = JSON.stringify(data.assignments || {});
  const result = await sql`
    INSERT INTO orders (order_id, username, email, platform, service, followers, likes_qty, views_qty, assignments, price, amount, currency, payment_intent_id, country_code, country_name)
    VALUES (${data.orderId}, ${data.username}, ${data.email}, ${data.platform}, ${data.service}, ${data.followers}, ${data.likesQty || 0}, ${data.viewsQty || 0}, ${assignmentsJson}::jsonb, ${data.price}, ${data.price}, ${data.currency || 'USD'}, ${data.paymentIntentId || null}, ${data.countryCode || null}, ${data.countryName || null})
    RETURNING id, order_id
  `;
  return result[0] as { id: number; order_id: string };
}

/**
 * Check if there's an active (non-completed) BulkFollows order for the same username + platform
 * within the last 24 hours. Used to prevent duplicate concurrent submissions.
 */
export async function hasActiveBulkFollowsOrder(username: string, platform: string, excludeOrderId?: string): Promise<{ active: boolean; conflictOrderId?: string }> {
  await ensureDbReady();
  const result = await sql`
    SELECT order_id FROM orders
    WHERE LOWER(username) = LOWER(${username})
      AND platform = ${platform}
      AND order_status NOT IN ('completed', 'cancelled', 'refunded')
      AND provider_orders != '[]'::jsonb
      AND created_at > NOW() - INTERVAL '24 hours'
      ${excludeOrderId ? sql`AND order_id != ${excludeOrderId}` : sql``}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (result.length > 0) {
    return { active: true, conflictOrderId: result[0].order_id };
  }
  return { active: false };
}

export async function updateProviderOrders(orderId: string, providerOrders: unknown[]) {
  await ensureDbReady();
  const json = JSON.stringify(providerOrders);
  await sql`
    UPDATE orders SET provider_orders = ${json}::jsonb, updated_at = NOW()
    WHERE order_id = ${orderId}
  `;
}

/**
 * Link a BulkFollows order ID to a specific provider sub-order (by type + index).
 * If no provider_orders exist yet for this type, create one.
 */
export async function linkProviderBfOrderId(
  orderId: string,
  subType: string,
  subIndex: number,
  bfOrderId: number
): Promise<void> {
  await ensureDbReady();
  // Fetch current provider_orders
  const rows = await sql`SELECT provider_orders FROM orders WHERE order_id = ${orderId}`;
  if (rows.length === 0) throw new Error("Order not found");

  const providerOrders: Array<{
    type: string;
    serviceId: number;
    bfOrderId: number | null;
    link: string;
    quantity: number;
    error?: string;
    status?: string;
  }> = rows[0].provider_orders || [];

  // Find matching sub-orders of this type
  let typeIdx = 0;
  let found = false;
  for (let i = 0; i < providerOrders.length; i++) {
    if (providerOrders[i].type === subType) {
      if (typeIdx === subIndex) {
        providerOrders[i].bfOrderId = bfOrderId;
        providerOrders[i].error = undefined;
        found = true;
        break;
      }
      typeIdx++;
    }
  }

  // If not found as an existing sub-order, append a new one
  if (!found) {
    providerOrders.push({
      type: subType,
      serviceId: 0,
      bfOrderId,
      link: "",
      quantity: 0,
    });
  }

  const json = JSON.stringify(providerOrders);
  await sql`
    UPDATE orders SET provider_orders = ${json}::jsonb, updated_at = NOW()
    WHERE order_id = ${orderId}
  `;
}

export async function getAllOrders(): Promise<DBOrder[]> {
  await ensureDbReady();
  const result = await sql`
    SELECT *,
      COUNT(*) OVER (PARTITION BY LOWER(COALESCE(email, username))) AS customer_total_orders,
      ROW_NUMBER() OVER (PARTITION BY LOWER(COALESCE(email, username)) ORDER BY created_at ASC) AS customer_order_number
    FROM orders
    ORDER BY created_at DESC
  `;
  return result as unknown as DBOrder[];
}

export async function getOrderStats() {
  await ensureDbReady();
  const totalResult = await sql`SELECT COUNT(*)::int AS total FROM orders`;
  const revenueResult = await sql`SELECT COALESCE(SUM(amount), 0) AS revenue FROM orders`;
  const todayResult = await sql`
    SELECT COUNT(*)::int AS today FROM orders
    WHERE created_at >= CURRENT_DATE
  `;
  const last24hResult = await sql`
    SELECT COUNT(*)::int AS recent FROM orders
    WHERE created_at >= NOW() - INTERVAL '24 hours'
  `;
  const monthlyResult = await sql`
    SELECT
      TO_CHAR(created_at, 'YYYY-MM') AS month,
      COUNT(*)::int AS orders,
      COALESCE(SUM(amount), 0)::float AS revenue
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY TO_CHAR(created_at, 'YYYY-MM')
    ORDER BY month ASC
  `;
  const platformResult = await sql`
    SELECT platform, COUNT(*)::int AS count, COALESCE(SUM(amount), 0)::float AS revenue
    FROM orders
    GROUP BY platform
  `;
  
  // Revenue breakdown by currency
  const byCurrencyResult = await sql`
    SELECT 
      COALESCE(currency, 'USD') AS currency,
      COUNT(*)::int AS orders,
      COALESCE(SUM(amount), 0)::float AS revenue
    FROM orders
    GROUP BY currency
    ORDER BY revenue DESC
  `;

  return {
    totalOrders: totalResult[0]?.total || 0,
    totalRevenue: parseFloat(revenueResult[0]?.revenue || "0"),
    todayOrders: todayResult[0]?.today || 0,
    last24h: last24hResult[0]?.recent || 0,
    monthly: monthlyResult as unknown as Array<{ month: string; orders: number; revenue: number }>,
    byPlatform: platformResult as unknown as Array<{ platform: string; count: number; revenue: number }>,
    byCurrency: byCurrencyResult as unknown as Array<{ currency: string; orders: number; revenue: number }>,
  };
}

export async function getCountryStats(): Promise<Array<{ country_code: string; country_name: string; orders: number; revenue: number }>> {
  await ensureDbReady();
  const result = await sql`
    SELECT
      COALESCE(country_code, 'XX') AS country_code,
      COALESCE(country_name, 'Unknown') AS country_name,
      COUNT(*)::int AS orders,
      COALESCE(SUM(amount), 0)::float AS revenue
    FROM orders
    GROUP BY country_code, country_name
    ORDER BY revenue DESC
  `;
  return result as unknown as Array<{ country_code: string; country_name: string; orders: number; revenue: number }>;
}

// ─── Analytics by Date ────────────────────────────────────

export interface DailyStats {
  totalOrders: number;
  totalRevenueItems: Array<{ amount: number; currency: string }>;
  uniqueCustomers: number;
  exitIntentPurchases: number;
  byCurrency: Array<{ currency: string; orders: number; revenue: number }>;
}

export async function getStatsByDate(date: string): Promise<DailyStats> {
  await ensureDbReady();
  
  // Parse date and create range
  const startDate = `${date} 00:00:00`;
  const endDate = `${date} 23:59:59`;

  // Total orders and revenue items for the day
  const ordersResult = await sql`
    SELECT 
      COUNT(*)::int AS total_orders,
      json_agg(json_build_object('amount', amount::float, 'currency', COALESCE(currency, 'USD'))) AS revenue_items
    FROM orders
    WHERE created_at >= ${startDate}::timestamp AND created_at <= ${endDate}::timestamp
  `;

  // Unique customers (by email or username)
  const uniqueResult = await sql`
    SELECT COUNT(DISTINCT LOWER(COALESCE(email, username)))::int AS unique_customers
    FROM orders
    WHERE created_at >= ${startDate}::timestamp AND created_at <= ${endDate}::timestamp
  `;

  // Exit intent purchases (downsell - typically 100 followers packs)
  const exitIntentResult = await sql`
    SELECT COUNT(*)::int AS exit_intent_count
    FROM orders
    WHERE created_at >= ${startDate}::timestamp AND created_at <= ${endDate}::timestamp
    AND followers <= 100
  `;

  // Revenue by currency
  const byCurrencyResult = await sql`
    SELECT 
      COALESCE(currency, 'USD') AS currency,
      COUNT(*)::int AS orders,
      COALESCE(SUM(amount), 0)::float AS revenue
    FROM orders
    WHERE created_at >= ${startDate}::timestamp AND created_at <= ${endDate}::timestamp
    GROUP BY currency
    ORDER BY revenue DESC
  `;

  const revenueItems = ordersResult[0]?.revenue_items || [];
  // Filter out null items from json_agg when no orders
  const validRevenueItems = Array.isArray(revenueItems) 
    ? revenueItems.filter((item: { amount: number; currency: string } | null) => item !== null)
    : [];

  return {
    totalOrders: ordersResult[0]?.total_orders || 0,
    totalRevenueItems: validRevenueItems,
    uniqueCustomers: uniqueResult[0]?.unique_customers || 0,
    exitIntentPurchases: exitIntentResult[0]?.exit_intent_count || 0,
    byCurrency: byCurrencyResult as unknown as Array<{ currency: string; orders: number; revenue: number }>,
  };
}

export async function updateOrderStatus(orderId: number, status: string) {
  await ensureDbReady();
  await sql`
    UPDATE orders SET order_status = ${status}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${orderId}
  `;
}

export async function updateOrderNotes(orderId: number, notes: string) {
  await ensureDbReady();
  await sql`
    UPDATE orders SET notes = ${notes}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${orderId}
  `;
}

export async function updateOrderCost(orderId: number, cost: number) {
  await ensureDbReady();
  await sql`
    UPDATE orders SET cost = ${cost}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${orderId}
  `;
}

// ─── Pricing ─────────────────────────────────────────────

export interface PricingTier {
  followers: string;
  price: string;
  /** Multi-currency prices — keyed by CurrencyCode (USD, EUR, GBP, CAD, AUD) */
  prices?: Record<string, string>;
}

export interface DownsellConfig {
  reachAmount: number;
  price: number;
  currency: string;
  ctaLabel: string;
  enabled: boolean;
  prices?: Record<string, number>;
}

export interface PricingData {
  tiktok: PricingTier[];
  tiktokLikes?: PricingTier[];
  tiktokViews?: PricingTier[];
  downsell?: DownsellConfig;
  popularIndex?: {
    tiktok?: number;
    tiktokLikes?: number;
    tiktokViews?: number;
  };
}

const DEFAULT_DOWNSELL: DownsellConfig = {
  reachAmount: 100,
  price: 1.90,
  currency: "$",
  ctaLabel: "Claim My Trial Pack",
  enabled: true,
  prices: { USD: 1.90, EUR: 1.90, GBP: 1.50, CAD: 2.50, AUD: 2.90 },
};

const DEFAULT_PRICING: PricingData = {
  tiktok: [
    { followers: "100",   price: "2.90",   prices: { USD: "2.90",   EUR: "2.90",   GBP: "2.50",   CAD: "3.90",   AUD: "4.50"   } },
    { followers: "250",   price: "5.90",   prices: { USD: "5.90",   EUR: "5.50",   GBP: "4.90",   CAD: "7.90",   AUD: "8.90"   } },
    { followers: "500",   price: "9.90",   prices: { USD: "9.90",   EUR: "8.90",   GBP: "7.90",   CAD: "12.90",  AUD: "14.90"  } },
    { followers: "1000",  price: "16.90",  prices: { USD: "16.90",  EUR: "14.90",  GBP: "12.90",  CAD: "21.90",  AUD: "24.90"  } },
    { followers: "2500",  price: "34.90",  prices: { USD: "34.90",  EUR: "29.90",  GBP: "27.90",  CAD: "44.90",  AUD: "49.90"  } },
    { followers: "5000",  price: "64.90",  prices: { USD: "64.90",  EUR: "59.90",  GBP: "49.90",  CAD: "79.90",  AUD: "89.90"  } },
    { followers: "10000", price: "99.90",  prices: { USD: "99.90",  EUR: "89.90",  GBP: "79.90",  CAD: "124.90", AUD: "139.90" } },
    { followers: "25000", price: "175.00", prices: { USD: "175.00", EUR: "159.90", GBP: "139.90", CAD: "219.90", AUD: "249.90" } },
  ],
  tiktokLikes: [
    { followers: "100",   price: "1.90",  prices: { USD: "1.90",  EUR: "1.90",  GBP: "1.50",  CAD: "2.50",  AUD: "2.90"  } },
    { followers: "250",   price: "3.50",  prices: { USD: "3.50",  EUR: "3.20",  GBP: "2.90",  CAD: "4.50",  AUD: "5.20"  } },
    { followers: "500",   price: "5.90",  prices: { USD: "5.90",  EUR: "5.50",  GBP: "4.90",  CAD: "7.90",  AUD: "8.90"  } },
    { followers: "1000",  price: "9.90",  prices: { USD: "9.90",  EUR: "8.90",  GBP: "7.90",  CAD: "12.90", AUD: "14.90" } },
    { followers: "2500",  price: "19.90", prices: { USD: "19.90", EUR: "17.90", GBP: "15.90", CAD: "24.90", AUD: "27.90" } },
    { followers: "5000",  price: "34.90", prices: { USD: "34.90", EUR: "29.90", GBP: "27.90", CAD: "44.90", AUD: "49.90" } },
    { followers: "10000", price: "59.90", prices: { USD: "59.90", EUR: "54.90", GBP: "47.90", CAD: "74.90", AUD: "84.90" } },
  ],
  tiktokViews: [
    { followers: "500",    price: "1.50",  prices: { USD: "1.50",  EUR: "1.50",  GBP: "1.20",  CAD: "1.90",  AUD: "2.20"  } },
    { followers: "1000",   price: "2.50",  prices: { USD: "2.50",  EUR: "2.20",  GBP: "1.90",  CAD: "3.20",  AUD: "3.50"  } },
    { followers: "2500",   price: "4.90",  prices: { USD: "4.90",  EUR: "4.50",  GBP: "3.90",  CAD: "6.50",  AUD: "7.20"  } },
    { followers: "5000",   price: "7.90",  prices: { USD: "7.90",  EUR: "6.90",  GBP: "5.90",  CAD: "9.90",  AUD: "11.90" } },
    { followers: "10000",  price: "12.90", prices: { USD: "12.90", EUR: "11.90", GBP: "9.90",  CAD: "16.90", AUD: "18.90" } },
    { followers: "25000",  price: "24.90", prices: { USD: "24.90", EUR: "22.90", GBP: "19.90", CAD: "32.90", AUD: "36.90" } },
    { followers: "50000",  price: "39.90", prices: { USD: "39.90", EUR: "36.90", GBP: "32.90", CAD: "52.90", AUD: "59.90" } },
    { followers: "100000", price: "69.90", prices: { USD: "69.90", EUR: "64.90", GBP: "56.90", CAD: "89.90", AUD: "99.90" } },
  ],
  downsell: DEFAULT_DOWNSELL,
};

export function getDefaultDownsell(): DownsellConfig {
  return DEFAULT_DOWNSELL;
}

export function getDefaultPricing(): PricingData {
  return DEFAULT_PRICING;
}

export async function getPricing(): Promise<PricingData> {
  try {
    await ensureDbReady();
    const result = await sql`
      SELECT data FROM pricing WHERE id = 'pricing-data'
    `;
    if (result.length > 0) {
      return result[0].data as PricingData;
    }
    return DEFAULT_PRICING;
  } catch {
    return DEFAULT_PRICING;
  }
}

export async function setPricing(data: PricingData) {
  await ensureDbReady();
  await sql`
    INSERT INTO pricing (id, data)
    VALUES ('pricing-data', ${JSON.stringify(data)}::jsonb)
    ON CONFLICT (id)
    DO UPDATE SET data = ${JSON.stringify(data)}::jsonb, updated_at = CURRENT_TIMESTAMP
  `;
}

// ─── Settings ─────────────────────────────────────────────

export interface AnnouncementBarSettings {
  enabled: boolean;
  text: string;
  highlightText: string;
  ctaText: string;
  ctaLink: string;
}

const DEFAULT_ANNOUNCEMENT_BAR: AnnouncementBarSettings = {
  enabled: true,
  text: "50% OFF on all AI Growth Packs today!",
  highlightText: "Flash Sale:",
  ctaText: "Claim offer →",
  ctaLink: "/pricing",
};

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    await ensureDbReady();
    const result = await sql`
      SELECT value FROM settings WHERE key = ${key}
    `;
    if (result.length > 0) {
      return JSON.parse(result[0].value) as T;
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await ensureDbReady();
  await sql`
    INSERT INTO settings (key, value)
    VALUES (${key}, ${JSON.stringify(value)})
    ON CONFLICT (key)
    DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = CURRENT_TIMESTAMP
  `;
}

export async function getAnnouncementBarSettings(): Promise<AnnouncementBarSettings> {
  return getSetting("announcement_bar", DEFAULT_ANNOUNCEMENT_BAR);
}

export async function setAnnouncementBarSettings(settings: AnnouncementBarSettings): Promise<void> {
  return setSetting("announcement_bar", settings);
}

// ─── BulkFollows Service IDs ─────────────────────────────

export interface BFServiceIds {
  tiktok_followers: number;
  tiktok_likes: number;
  tiktok_views: number;
}

const DEFAULT_BF_SERVICE_IDS: BFServiceIds = {
  tiktok_followers: 14270,
  tiktok_likes: 14256,
  tiktok_views: 640,
};

export async function getBFServiceIds(): Promise<BFServiceIds> {
  return getSetting("bf_service_ids", DEFAULT_BF_SERVICE_IDS);
}

export async function setBFServiceIds(ids: BFServiceIds): Promise<void> {
  return setSetting("bf_service_ids", ids);
}

// ─── Default Bundle Quantities ───────────────────────────

export interface DefaultQuantities {
  followers: number;
  likes: number;
  views: number;
}

const DEFAULT_BUNDLE_QUANTITIES: DefaultQuantities = {
  followers: 0,
  likes: 0,
  views: 0,
};

export async function getDefaultQuantities(): Promise<DefaultQuantities> {
  return getSetting("default_quantities", DEFAULT_BUNDLE_QUANTITIES);
}

export async function setDefaultQuantities(qty: DefaultQuantities): Promise<void> {
  return setSetting("default_quantities", qty);
}

// ─── Admin Auth ──────────────────────────────────────────

export async function getAdminByUsername(username: string) {
  await ensureDbReady();
  const result = await sql`
    SELECT * FROM admin_users WHERE username = ${username}
  `;
  if (result.length > 0) {
    return result[0] as { id: number; username: string; password: string };
  }
  return null;
}

export function generateAdminToken(username: string): string {
  return Buffer.from(
    JSON.stringify({
      username,
      role: "admin",
      exp: Date.now() + 24 * 60 * 60 * 1000,
    })
  ).toString("base64");
}

export function verifyAdminToken(token: string | null): boolean {
  if (!token) return false;
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    return decoded.exp > Date.now() && decoded.role === "admin";
  } catch {
    return false;
  }
}

export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  return authHeader?.replace("Bearer ", "") || null;
}
