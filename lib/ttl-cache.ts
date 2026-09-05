/* Cross-request cache backed by globalThis: warm server instances skip
   repeated Supabase round-trips. The marketplace state and click logs don't
   change every second — a 60s TTL (10min stale window) is invisible to users
   and turns the 3–5s autocomplete/search/homepage reads into ~0ms for every
   visitor after the first on an instance. Entries never persist across
   deployments, which is what we want. */

type CacheEntry<T> = { t: number; v: T; refreshing?: boolean };
type CacheStore = Record<string, CacheEntry<unknown>>;

const g = globalThis as unknown as { __finditCache?: CacheStore };

function store(): CacheStore {
  return (g.__finditCache ??= {});
}

export function cacheGet<T>(key: string, ttlMs: number): T | undefined {
  const hit = store()[key] as CacheEntry<T> | undefined;
  if (hit && Date.now() - hit.t < ttlMs) return hit.v;
  return undefined;
}

export function cacheSet<T>(key: string, value: T): void {
  store()[key] = { t: Date.now(), v: value };
}

/**
 * Stale-while-revalidate read. Fresh (≤ ttlMs) → instant. Stale but within
 * staleMs → return the stale value immediately and refresh in the background
 * (one in-flight refresh at a time). Nothing usable → await fn.
 * This is what makes autocomplete/search feel instant for everyone: only the
 * very first request after a cold start pays the full store latency.
 */
export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>, staleMs = 10 * 60_000): Promise<T> {
  const s = store();
  const hit = s[key] as CacheEntry<T> | undefined;
  const now = Date.now();
  if (hit) {
    const age = now - hit.t;
    if (age < ttlMs) return hit.v;
    if (age < staleMs) {
      if (!hit.refreshing) {
        hit.refreshing = true;
        fn()
          .then((v) => {
            s[key] = { t: Date.now(), v };
          })
          .catch(() => {
            if (s[key] === hit) hit.refreshing = false;
          });
      }
      return hit.v;
    }
  }
  const v = await fn();
  s[key] = { t: now, v };
  return v;
}

/** Drop cached entries (admin flows call this so changes show immediately). */
export function cacheReset(key?: string): void {
  const s = store();
  if (key) delete s[key];
  else g.__finditCache = {};
}
