/**
 * Admin users — who can get into `/admin`.
 *
 * Passwords are **never stored**. What is kept is a scrypt hash with a random
 * per-user salt, so the stored record cannot be turned back into the password
 * even by whoever holds the database.
 *
 * Same two backings as everything else: a local JSON file by default, Supabase
 * when configured. Server-only.
 *
 * 📖 Docs: obsidian/backend/admin-area.md
 */

import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { ApiError } from "@/lib/api";
import { getSupabaseConfig } from "@/lib/catalog/supabase-store";

export interface AdminUser {
  id: string;
  /** Lower-cased on the way in — the login is not case-sensitive. */
  email: string;
  name: string;
  /** `scrypt$<salt>$<hash>`. Never leaves the server. */
  passwordHash: string;
  createdAt: string;
}

/** What the admin UI is allowed to see. */
export type PublicAdminUser = Omit<AdminUser, "passwordHash">;

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "admin-users.json");

const KEY_LENGTH = 64;

export const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${hash}`;
};

export const verifyPassword = (password: string, stored: string): boolean => {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const candidate = scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length &&
    timingSafeEqual(candidate, expected)
  );
};

export const toPublic = (user: AdminUser): PublicAdminUser => {
  const { passwordHash: _ignored, ...rest } = user;
  return rest;
};

// ── file backing ────────────────────────────────────────────────────────────

const readFileUsers = async (): Promise<AdminUser[]> => {
  try {
    const parsed: unknown = JSON.parse(await readFile(DATA_FILE, "utf8"));
    return Array.isArray(parsed) ? (parsed as AdminUser[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
};

const writeFileUsers = async (users: AdminUser[]) => {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(users, null, 2), "utf8");
};

// ── supabase backing ────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
}

const fromRow = (row: UserRow): AdminUser => ({
  id: row.id,
  email: row.email,
  name: row.name,
  passwordHash: row.password_hash,
  createdAt: row.created_at,
});

const rest = async (query: string, init: RequestInit = {}) => {
  const config = getSupabaseConfig();
  if (!config) {
    throw new ApiError(500, "supabase_not_configured", "Supabase não está configurado.");
  }

  const response = await fetch(`${config.url}/rest/v1/${query}`, {
    ...init,
    headers: {
      apikey: config.serviceKey,
      authorization: `Bearer ${config.serviceKey}`,
      "content-type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[admin/users]", response.status, detail);
    throw new ApiError(502, "supabase_error", "Não foi possível ler os usuários.");
  }
  return response;
};

/** Named away from `use*` so it is not mistaken for a React hook. */
const storingInSupabase = () => getSupabaseConfig() !== null;

// ── the store ───────────────────────────────────────────────────────────────

export async function listUsers(): Promise<AdminUser[]> {
  if (!storingInSupabase()) return readFileUsers();
  const response = await rest("admin_users?select=*&order=created_at.asc");
  return ((await response.json()) as UserRow[]).map(fromRow);
}

export async function findUserByEmail(email: string): Promise<AdminUser | null> {
  const wanted = email.trim().toLowerCase();
  return (await listUsers()).find((user) => user.email === wanted) ?? null;
}

export async function findUserById(id: string): Promise<AdminUser | null> {
  return (await listUsers()).find((user) => user.id === id) ?? null;
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<AdminUser> {
  const email = input.email.trim().toLowerCase();
  if (await findUserByEmail(email)) {
    throw new ApiError(409, "email_taken", "Já existe um acesso com esse e-mail.");
  }

  const user: AdminUser = {
    id: randomUUID(),
    email,
    name: input.name.trim(),
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };

  if (storingInSupabase()) {
    await rest("admin_users", {
      method: "POST",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        password_hash: user.passwordHash,
        created_at: user.createdAt,
      }),
    });
    return user;
  }

  await writeFileUsers([...(await readFileUsers()), user]);
  return user;
}

export async function setPassword(id: string, password: string): Promise<void> {
  const passwordHash = hashPassword(password);

  if (storingInSupabase()) {
    await rest(`admin_users?id=eq.${id}`, {
      method: "PATCH",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({ password_hash: passwordHash }),
    });
    return;
  }

  const users = await readFileUsers();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) throw new ApiError(404, "not_found", "Acesso não encontrado.");
  users[index] = { ...users[index], passwordHash };
  await writeFileUsers(users);
}

export async function removeUser(id: string): Promise<void> {
  const users = await listUsers();
  // Locking everyone out is not a thing the UI should be able to do.
  if (users.length <= 1) {
    throw new ApiError(
      400,
      "last_user",
      "Este é o único acesso — crie outro antes de remover.",
    );
  }
  if (!users.some((user) => user.id === id)) {
    throw new ApiError(404, "not_found", "Acesso não encontrado.");
  }

  if (storingInSupabase()) {
    await rest(`admin_users?id=eq.${id}`, {
      method: "DELETE",
      headers: { prefer: "return=minimal" },
    });
    return;
  }
  await writeFileUsers((await readFileUsers()).filter((user) => user.id !== id));
}

/**
 * Creates the first access from the environment, once.
 *
 * This is the way in on a fresh install: set `ADMIN_EMAIL` and `ADMIN_PASSWORD`,
 * and the first time the admin is opened that pair becomes a real user with a
 * hashed password. After that the variables are only a fallback — changing the
 * password is done in the admin, and it does not read them again.
 */
export async function ensureSeedUser(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const users = await listUsers();
  if (users.length > 0) return;

  await createUser({ email, name: process.env.ADMIN_NAME?.trim() || "Admin", password });
}
