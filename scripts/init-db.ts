import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const sql = neon(process.env.DATABASE_URL!);

async function init() {
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("✓ Table 'orders' created");

  await sql`
    CREATE TABLE IF NOT EXISTS pricing (
      id VARCHAR(50) PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("✓ Table 'pricing' created");

  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("✓ Table 'admin_users' created");

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(255) UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("✓ Table 'settings' created");

  await sql`CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_platform ON orders(platform)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status)`;
  console.log("✓ Indexes created");

  console.log("\nAll tables and indexes initialized successfully!");
}

init().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
