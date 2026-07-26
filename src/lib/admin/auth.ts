/**
 * Admin access control.
 *
 * Off by default, on purpose: the shop asked to work without a login while the
 * site is unpublished. Set `ADMIN_PASSWORD` and the whole area — pages *and*
 * endpoints — starts demanding it, with no other change.
 *
 * The session is a signed cookie, not a stored session: the value is an HMAC of
 * a fixed subject keyed by the password, so it verifies without any session
 * table, and changing the password invalidates every existing cookie.
 *
 * 📖 Docs: obsidian/backend/admin-area.md
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api";

export const ADMIN_COOKIE = "renova_admin";
const SUBJECT = "renova-admin-v1";

const getPassword = () => process.env.ADMIN_PASSWORD || null;

/** `true` once a password exists — the admin is locked from that moment. */
export const isAdminLocked = () => getPassword() !== null;

const sign = (password: string) =>
  createHmac("sha256", password).update(SUBJECT).digest("hex");

/** Constant-time compare, so a wrong token cannot be found byte by byte. */
const matches = (candidate: string, expected: string) => {
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

export const verifyPassword = (candidate: string) => {
  const password = getPassword();
  return password !== null && matches(candidate, password);
};

export const createSessionToken = () => {
  const password = getPassword();
  if (!password) {
    throw new ApiError(400, "admin_open", "O admin não tem senha configurada.");
  }
  return sign(password);
};

/** Whether the current request carries a valid session. Open mode is always true. */
export async function hasAdminSession(): Promise<boolean> {
  const password = getPassword();
  if (!password) return true;

  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return typeof token === "string" && matches(token, sign(password));
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
