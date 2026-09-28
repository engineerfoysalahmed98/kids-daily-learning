/**
 * Sliding-window rate limiter.
 * In-memory — correct for a single instance. ▶ PRODUCTION (multi-instance):
 * swap `store` for Redis/Upstash (same interface: timestamps per key).
 */
const store = new Map<string, number[]>();

export interface Limit { max: number; windowMs: number; }

export const LIMITS = {
  login: { max: 10, windowMs: 15 * 60_000 },
  signup: { max: 5, windowMs: 60 * 60_000 },
  buddyBurst: { max: 20, windowMs: 10 * 60_000 },
  buddyDaily: { max: 150, windowMs: 24 * 60 * 60_000 },
  pin: { max: 5, windowMs: 15 * 60_000 },
} satisfies Record<string, Limit>;

export function hit(key: string, limit: Limit, now = Date.now()): { ok: boolean; remaining: number; retryAfterSec: number } {
  const recent = (store.get(key) ?? []).filter((t) => now - t < limit.windowMs);
  if (recent.length >= limit.max) {
    store.set(key, recent);
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((limit.windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  store.set(key, recent);
  if (store.size > 50_000) for (const k of store.keys()) { store.delete(k); if (store.size < 40_000) break; }
  return { ok: true, remaining: limit.max - recent.length, retryAfterSec: 0 };
}
