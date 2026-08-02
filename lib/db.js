// Postgres persistence for favorites (Vercel Postgres / Neon).
//
// Single-user by design: the whole app sits behind the passcode gate, so all
// favorites live in ONE row (id = 'singleton'). No per-user scoping, no auth
// tables — the gate is the boundary.
//
// Isolated like lib/yahoo.js / lib/edgar.js: if no Postgres connection string
// is configured this module reports `configured === false` and the API/route
// falls back to localStorage-only, so the app keeps working before the DB is
// set up.

import { createPool } from '@vercel/postgres';

// Different Vercel/Neon integrations name the connection string differently
// (POSTGRES_URL, DATABASE_URL, ...). Resolve whichever pooled one exists so
// setup doesn't depend on an exact variable name. Pooled URLs first —
// @vercel/postgres needs a pooled connection.
function connectionString() {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED ||
    null
  );
}

export function dbConfigured() {
  return Boolean(connectionString());
}

let _pool = null;
function pool() {
  if (!_pool) _pool = createPool({ connectionString: connectionString() });
  return _pool;
}

const ROW_ID = 'singleton';
let _ready = false;

async function ensureTable() {
  if (_ready) return;
  await pool().sql`
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  _ready = true;
}

export async function getFavorites() {
  await ensureTable();
  const { rows } = await pool().sql`SELECT data FROM favorites WHERE id = ${ROW_ID} LIMIT 1`;
  return rows[0]?.data ?? null;
}

export async function saveFavorites(data) {
  await ensureTable();
  const json = JSON.stringify(data ?? { tickers: [], options: [] });
  await pool().sql`
    INSERT INTO favorites (id, data, updated_at)
    VALUES (${ROW_ID}, ${json}::jsonb, now())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;
  return true;
}
