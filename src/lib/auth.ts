import "server-only";
import { createHmac, createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * Authentication: usernames + passwords on Person, sessions as signed cookies.
 *
 * - Passwords are scrypt-hashed with a per-user salt (node:crypto, no deps).
 * - The session cookie is `personId.expiry.hmac` — stateless, verified by
 *   signature in proxy.ts on every request, and against the database in the
 *   app shell (so removing someone's login locks them out on next load).
 * - The signing secret is AUTH_SECRET, falling back to a hash of DATABASE_URL
 *   so a fresh deploy works with zero extra configuration. Setting AUTH_SECRET
 *   is still recommended: rotating the database password then won't log
 *   everyone out.
 */

export const SESSION_COOKIE = "jc_session";
const SESSION_DAYS = 30;

export function authSecret(): string {
  return (
    process.env.AUTH_SECRET ??
    createHash("sha256").update(`jc-auth:${process.env.DATABASE_URL ?? ""}`).digest("hex")
  );
}

// ---------------------------------------------------------------- passwords

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// ------------------------------------------------------------------ tokens

function sign(payload: string): string {
  return createHmac("sha256", authSecret()).update(payload).digest("base64url");
}

export function createToken(personId: string): string {
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  const payload = `${personId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

/** Returns the personId for a valid, unexpired token — otherwise null. */
export function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [personId, expires, signature] = parts;
  const payload = `${personId}.${expires}`;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(expires) < Date.now()) return null;
  return personId;
}

// ---------------------------------------------------------------- sessions

export async function createSession(personId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createToken(personId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** The logged-in person, verified against the database. Null when signed out
 *  or when their login has been removed since the cookie was issued. */
export async function getSessionPerson() {
  const store = await cookies();
  const personId = verifyToken(store.get(SESSION_COOKIE)?.value);
  if (!personId) return null;
  const person = await db.person.findUnique({
    where: { id: personId },
    select: { id: true, firstName: true, lastName: true, username: true, passwordHash: true },
  });
  if (!person?.passwordHash) return null;
  return person;
}

/** True when nobody can log in yet — the app is in first-run setup mode. */
export async function noLoginsExist(): Promise<boolean> {
  const count = await db.person.count({ where: { passwordHash: { not: null } } });
  return count === 0;
}
