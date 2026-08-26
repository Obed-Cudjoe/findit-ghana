// Shared admin-auth primitives. Fail-closed: if ADMIN_PASSWORD is not set,
// there is no default — the login endpoint refuses to issue sessions and the
// middleware refuses every token, so /admin stays locked until the owner
// configures a password. (The repo is public; a hardcoded fallback password
// would be a known credential.)

export function getAdminPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD?.trim();
  return pw ? pw : null;
}

// HMAC secret for the session JWT. Returns a random secret when unconfigured
// so any existing cookie fails verification (safe on both node and edge runtimes).
export function getAdminJwtSecret(): Uint8Array {
  const pw = getAdminPassword();
  if (pw) return new TextEncoder().encode(pw);
  return new TextEncoder().encode(crypto.randomUUID()); // random per boot: verifies nothing
}

// Constant-time string comparison — avoids leaking the password length or
// prefix through response timing. Pure JS so it works in every runtime.
export function passwordMatches(candidate: unknown): boolean {
  const expected = getAdminPassword();
  if (!expected || typeof candidate !== "string") return false;
  const len = Math.max(candidate.length, expected.length);
  let diff = candidate.length ^ expected.length;
  for (let i = 0; i < len; i++) {
    diff |= (candidate.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
  }
  return diff === 0;
}
