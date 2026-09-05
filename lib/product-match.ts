// Same-product matching: vendor self-listings that name the same item
// (and listings that match a catalogue product) collapse onto one product
// page so the existing vendor comparison table shows every offer.

const STOP = new Set([
  "plus", "free", "voucher", "cover", "screen", "protector", "the", "and",
  "with", "for", "from", "new", "official", "warranty", "gift", "gifts",
  "bundle", "combo", "set", "only", "in", "on", "of", "to", "by", "a", "an",
]);

export function rawTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[+/|,;]+/g, " ")
    .replace(/[^a-z0-9.]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Storage / capacity figures that distinguish variants (128GB vs 256GB). */
export function storageTokens(name: string): string[] {
  const found = new Set<string>();
  const re = /(\d+(?:\.\d+)?)\s*(tb|gb|mb)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(name))) {
    const n = m[1];
    const u = m[2].toLowerCase();
    found.add(`${n}${u}`);
  }
  return [...found];
}

/**
 * The storage capacity a title really refers to, in GB. Titles like
 * "128GB + 4GB" or "4GB/64GB" carry a RAM figure beside the storage figure —
 * the LARGEST capacity is the storage, the small one is RAM. Returns null
 * when the title mentions no capacity at all.
 */
export function effectiveStorageGb(name: string): number | null {
  const re = /(\d+(?:\.\d+)?)\s*(tb|gb|mb)\b/gi;
  let best: number | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(name))) {
    const n = parseFloat(m[1]);
    const u = m[2].toLowerCase();
    const gb = u === "tb" ? n * 1024 : u === "mb" ? n / 1024 : n;
    if (best === null || gb > best) best = gb;
  }
  return best;
}

export function significantTokens(name: string): string[] {
  return rawTokens(name).filter((t) => t.length > 1 && !STOP.has(t) && !/^\d+$/.test(t));
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const sb = new Set(b);
  let overlap = 0;
  for (const t of a) if (sb.has(t)) overlap++;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : overlap / union;
}

/**
 * True when two product titles almost certainly refer to the same SKU.
 * Storage figures must agree when both titles mention them, so
 * "iPhone 13 128GB" never merges with "iPhone 13 256GB".
 */
export function namesLikelySame(a: string, b: string): boolean {
  if (!a || !b) return false;
  const na = a.trim().toLowerCase();
  const nb = b.trim().toLowerCase();
  if (na === nb) return true;

  const sa = storageTokens(a);
  const sb = storageTokens(b);
  if (sa.length > 0 && sb.length > 0) {
    const setB = new Set(sb);
    if (!sa.some((s) => setB.has(s))) return false;
  }

  const ta = significantTokens(a);
  const tb = significantTokens(b);
  if (ta.length === 0 || tb.length === 0) return false;

  // First significant token is usually the brand — require it when both look branded.
  if (ta[0] !== tb[0] && ta[0].length >= 3 && tb[0].length >= 3) {
    // Allow "samsung galaxy a17" vs "galaxy a17" (brand omitted on one side)
    if (!(tb.includes(ta[0]) || ta.includes(tb[0]))) return false;
  }

  const overlap = ta.filter((t) => tb.includes(t)).length;
  const minLen = Math.min(ta.length, tb.length);
  if (overlap < Math.min(3, minLen)) return false;
  if (overlap / minLen < 0.6) return false;

  // Very short titles ("Pop 20") still match a longer catalogue title if
  // every significant token appears in the longer one.
  if (minLen <= 3 && overlap === minLen) return true;

  return jaccard(ta, tb) >= 0.45 || overlap / minLen >= 0.7;
}

export function findMatchingProduct<T extends { name: string; category: string }>(
  name: string,
  category: string,
  products: T[],
): T | undefined {
  return products.find((p) => p.category === category && namesLikelySame(name, p.name));
}
