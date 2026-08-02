// Shared session-cookie signing/verification. Uses Web Crypto (HMAC-SHA256),
// which is available in BOTH the Edge runtime (middleware) and the Node
// runtime (API routes), so the exact same logic guards pages and endpoints.
//
// The cookie is stateless: `v1.<expiryMs>.<hmac(v1.<expiryMs>)>`. There's no
// server-side session store — verification just recomputes the HMAC and
// checks the expiry. Secret comes from SESSION_SECRET.

export const AUTH_COOKIE = 'osr_auth';
const VERSION = 'v1';
const DEFAULT_TTL_MS = 90 * 24 * 60 * 60 * 1000; // ~90 days

function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return toHex(sig);
}

// Constant-time-ish string compare (avoids early-exit timing leaks).
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signSession(secret, ttlMs = DEFAULT_TTL_MS) {
  const expiry = Date.now() + ttlMs;
  const payload = `${VERSION}.${expiry}`;
  const sig = await hmac(payload, secret);
  return `${payload}.${sig}`;
}

export async function verifySession(token, secret) {
  if (!token || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [ver, expiryStr, sig] = parts;
  if (ver !== VERSION) return false;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return false;
  const expected = await hmac(`${ver}.${expiryStr}`, secret);
  return safeEqual(sig, expected);
}
