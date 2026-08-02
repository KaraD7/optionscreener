// Postgres persistence for favorites (Vercel Postgres / Neon).
//
// Single-user by design: the whole app sits behind the passcode gate, so all
// favorites live in ONE row (id = 'singleton'). No per-user scoping, no auth
// tables — the gate is the boundary.
//
// Isolated like lib/yahoo.js / lib/edgar.js: if POSTGRES_URL isn't configured
// this module reports `configured === false` and the API/route falls back to
// localStorage-only, so the app keeps working before the DB is set up.

import { sql } from '@vercel/postgres';

export function dbConfigured() {
  return Boolean(
    process.env.POSTGRES_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL
  );
}

const ROW_ID = 'singleton';
let _ready = false;

async function ensureTable() {
  if (_ready) return;
  await sql`
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
  const { rows } = await sql`SELECT data FROM favorites WHERE id = ${ROW_ID} LIMIT 1`;
  return rows[0]?.data ?? null;
}

export async function saveFavorites(data) {
  await ensureTable();
  const json = JSON.stringify(data ?? { tickers: [], options: [] });
  await sql`
    INSERT INTO favorites (id, data, updated_at)
    VALUES (${ROW_ID}, ${json}::jsonb, now())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;
  return true;
}
