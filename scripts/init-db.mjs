import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in .env.local");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function init() {
  console.log("🔄 Connecting to database...");

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
  console.log("✅ orders table");

  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS country_code VARCHAR(10)`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS country_name VARCHAR(255)`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD'`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS likes_qty INTEGER DEFAULT 0`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS views_qty INTEGER DEFAULT 0`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS assignments JSONB DEFAULT '{}'::jsonb`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_orders JSONB DEFAULT '[]'::jsonb`;
  console.log("✅ orders columns migrated");

  await sql`
    CREATE TABLE IF NOT EXISTS pricing (
      id VARCHAR(50) PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("✅ pricing table");

  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("✅ admin_users table");

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(255) UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("✅ settings table");

  await sql`CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_platform ON orders(platform)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status)`;
  console.log("✅ indexes created");

  console.log("\n🎉 Database initialized successfully!");
}

init().catch((err) => {
  console.error("❌ Init failed:", err);
  process.exit(1);
});
