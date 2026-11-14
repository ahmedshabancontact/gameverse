import "server-only";
import crypto from "node:crypto";

const SECRET = process.env.SESSION_SECRET || "gameverse-cabinet-secret-v1";
export const SESSION_COOKIE = "gv_session";

function hmac(payload: string) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function signSession(userId: string, days = 30) {
  const exp = Date.now() + days * 86400000;
  const payload = `${userId}.${exp}`;
  return `${payload}.${hmac(payload)}`;
}

export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 3) return null;
  const exp = Number(parts[parts.length - 2]);
  const sig = parts[parts.length - 1];
  const payload = parts.slice(0, -1).join(".");
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  const expected = hmac(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return parts.slice(0, -2).join(".") || null;
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string | null) {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(derived);
  const b = Buffer.from(hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export { levelFromXp, levelProgress, xpForLevel } from "./level";
