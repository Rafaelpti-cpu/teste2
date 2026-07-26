/**
 * Admin access control.
 *
 * The area is **open while no access exists** — the shop asked to work without
 * a login before launch. Create the first access (via `ADMIN_EMAIL` /
 * `ADMIN_PASSWORD`, or from the admin itself) and everything locks: pages
 * redirect, endpoints answer 401.
 *
 * The session is a signed cookie, not a session table: `<userId>.<hmac>`, where
 * the HMAC is keyed by that user's **password hash**. It verifies with one
 * lookup, needs no extra secret to configure, and changing a password
 * invalidates every cookie that user had.
 *
 * 📖 Docs: obsidian/backend/admin-area.md
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api";
import {
  ensureSeedUser,
  findUserById,
  listUsers,
  toPublic,
  verifyPassword,
  type PublicAdminUser,
} from "@/lib/admin/users";

export const ADMIN_COOKIE = "renova_admin";
const SUBJECT = "renova-admin-v2";

const sign = (userId: string, passwordHash: string) =>
  createHmac("sha256", passwordHash).update(`${SUBJECT}:${userId}`).digest("hex");

/** Constant-time compare, so a wrong token cannot be found byte by byte. */
const matches = (candidate: string, expected: string) => {
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

/** `true` once at least one access exists — the admin is locked from then on. */
export async function isAdminLocked(): Promise<boolean> {
  await ensureSeedUser();
  return (await listUsers()).length > 0;
}

export async function createSessionToken(userId: string): Promise<string> {
  const user = await findUserById(userId);
  if (!user) throw new ApiError(404, "not_found", "Acesso não encontrado.");
  return `${user.id}.${sign(user.id, user.passwordHash)}`;
}

/** Checks the e-mail and password pair. Returns the user, or `null`. */
export async function authenticate(
  email: string,
  password: string,
): Promise<PublicAdminUser | null> {
  const wanted = email.trim().toLowerCase();
  const user = (await listUsers()).find((item) => item.email === wanted);
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  return toPublic(user);
}

/** Who is signed in, or `null`. Open mode has no user and still returns `null`. */
export async function getCurrentUser(): Promise<PublicAdminUser | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const [userId, signature] = token.split(".");
  if (!userId || !signature) return null;

  const user = await findUserById(userId);
  if (!user) return null;

  return matches(signature, sign(user.id, user.passwordHash))
    ? toPublic(user)
    : null;
}

/** Whether this request may act. Always true while no access exists. */
export async function hasAdminSession(): Promise<boolean> {
  if (!(await isAdminLocked())) return true;
  return (await getCurrentUser()) !== null;
}

/** Guard for route handlers — throws 401 when the session is missing. */
export async function assertAdmin(): Promise<void> {
  if (await hasAdminSession()) return;
  throw new ApiError(401, "unauthorized", "Faça login para continuar.");
}

/**
 * Guard for admin pages — redirects to the login screen.
 *
 * Called by each protected view rather than by `app/admin/layout.tsx`, because
 * that layout also wraps the login page and would redirect it to itself.
 */
export async function requireAdmin(): Promise<void> {
  if (await hasAdminSession()) return;
  redirect("/admin/entrar");
}
