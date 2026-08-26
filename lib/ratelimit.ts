// Minimal in-memory rate limiter for public form endpoints and admin login.
//
// Best-effort by design: Vercel serverless instances each keep their own
// counts, so limits are per-instance. That is still enough to make brute-
// forcing and form spam annoying without any external dependency. If stronger
// guarantees are needed later, swap the body of this file for Upstash Redis
// (free tier) — the call sites stay identical.

const buckets = new Map<string, { count: number; resetAt: number }>();

// Periodically drop expired buckets so the map cannot grow unbounded.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfterSec: 0 };
}

// Best-effort client identity: Vercel forwards the real client IP in
// x-forwarded-for (first entry). Fall back to a constant so keyless requests
// still share one bucket rather than bypassing the limit.
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
