import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ADMIN_COOKIE,
  createSessionToken,
  isAdminLocked,
  verifyPassword,
} from "@/lib/admin/auth";
import { ApiError, handle } from "@/lib/api";

/**
 * Admin session. Only meaningful once `ADMIN_PASSWORD` is set — without it the
 * area is open and there is nothing to log into.
 */

const loginSchema = z.object({ password: z.string().min(1) });

/** Naive in-process throttle. Enough to make guessing slow on a single box. */
const attempts = new Map<string, { count: number; firstAt: number }>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 8;

const throttle = (key: string) => {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
    return;
  }
  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) {
    throw new ApiError(429, "too_many_attempts", "Muitas tentativas. Espere um minuto.");
  }
};

export const POST = handle(async (req) => {
  if (!isAdminLocked()) {
    throw new ApiError(400, "admin_open", "O admin está aberto, sem senha.");
  }

  throttle(req.headers.get("x-forwarded-for") ?? "local");

  const { password } = loginSchema.parse(await req.json());
  if (!verifyPassword(password)) {
    throw new ApiError(401, "invalid_password", "Senha incorreta.");
  }

  const response = NextResponse.json({ data: { authenticated: true } });
  response.cookies.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
});

export const DELETE = handle(async () => {
  const response = NextResponse.json({ data: { authenticated: false } });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
});
