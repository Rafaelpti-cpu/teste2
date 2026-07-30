/**
 * Supabase-backed catalogue — the deploy-anywhere backing.
 *
 * Talks to PostgREST and Storage over plain `fetch` rather than pulling in the
 * JS SDK: the six calls below are the whole surface, and this keeps the
 * dependency list (and the serverless bundle) untouched.
 *
 * Server-only by construction — it reads the **service role** key, which must
 * never be a `NEXT_PUBLIC_` variable. It is only ever imported from
 * `app/api/**` route handlers and server components.
 *
 * The table it expects is in `supabase/schema.sql`.
 *
 * 📖 Docs: obsidian/backend/catalog-store.md
 */

import { catalogSeed } from "@/data/catalog-seed";
import { ApiError } from "@/lib/api";
import { slugify } from "@/lib/catalog/schema";
import type { CatalogStore } from "@/lib/catalog/store";
import type { Product, ProductCategory, ProductInput } from "@/types/catalog";
import type { ProductPatchPayload } from "@/lib/catalog/schema";

interface SupabaseConfig {
  url: string;
  serviceKey: string;
  bucket: string;
}

const DEFAULT_BUCKET = "product-images";

/**
 * The bucket name, defended against the paste.
 *
 * A real one is lowercase letters, digits, dots and dashes — never a space and
 * never a newline. This variable was once set, from a phone, to the whole
 * documentation table it was listed in; every read and every upload then failed
 * with "Bucket not found", which reads like a missing bucket rather than a
 * malformed name and cost days.
 *
 * Trimming fixes the ordinary case (a trailing newline from a copy). Anything
 * still malformed falls back to the default and says so loudly in the log,
 * because a shop that cannot upload photos is worse than a variable quietly
 * ignored — and the name is now printed in the error either way.
 */
const bucketName = (): string => {
  const raw = process.env.SUPABASE_STORAGE_BUCKET?.trim();
  if (!raw) return DEFAULT_BUCKET;
  if (!/^[a-z0-9][a-z0-9.\-_]*$/i.test(raw)) {
    console.error(
      `[catalog/supabase] SUPABASE_STORAGE_BUCKET não parece um nome de pasta ` +
        `(${JSON.stringify(raw.slice(0, 60))}…). Usando "${DEFAULT_BUCKET}".`,
    );
    return DEFAULT_BUCKET;
  }
  return raw;
};

export const getSupabaseConfig = (): SupabaseConfig | null => {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return null;
  return { url, serviceKey, bucket: bucketName() };
};

const config = (): SupabaseConfig => {
  const value = getSupabaseConfig();
  if (!value) {
    throw new ApiError(
      500,
      "supabase_not_configured",
      "Supabase não está configurado.",
    );
  }
  return value;
};

/** The row shape PostgREST returns — snake_case, straight from Postgres. */
interface ProductRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number | string;
  category: string;
  sizes: string[] | null;
  colors: { name: string; hex: string }[] | null;
  images: string[] | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const fromRow = (row: ProductRow): Product => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description ?? "",
  price: typeof row.price === "string" ? Number(row.price) : row.price,
  category: row.category as ProductCategory,
  sizes: row.sizes ?? [],
  colors: row.colors ?? [],
  images: row.images ?? [],
  active: row.active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toRow = (input: Partial<ProductInput>) => ({
  ...(input.name !== undefined && { name: input.name }),
  ...(input.description !== undefined && { description: input.description }),
  ...(input.price !== undefined && { price: input.price }),
  ...(input.category !== undefined && { category: input.category }),
  ...(input.sizes !== undefined && { sizes: input.sizes }),
  ...(input.colors !== undefined && { colors: input.colors }),
  ...(input.images !== undefined && { images: input.images }),
  ...(input.active !== undefined && { active: input.active }),
});

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

/**
 * How many times a **read** is attempted before giving up.
 *
 * Only reads. A retried `POST` would create two products, and a retried
 * `DELETE` would report a 404 for work that succeeded — the storefront going
 * blank is worth guarding against, duplicating the shop's data is not.
 *
 * The reason it matters: every page render on the site reads this table, so a
 * single transient failure — a dropped connection, a cold serverless start
 * landing on a busy pool — takes the whole storefront down to the error screen
 * for that visitor. One retry turns that into a few hundred milliseconds
 * nobody notices.
 */
const READ_ATTEMPTS = 3;
const RETRY_DELAY_MS = 150;

const isRead = (init: RequestInit) =>
  !init.method || init.method.toUpperCase() === "GET";

const rest = async (path: string, init: RequestInit = {}) => {
  const { url, serviceKey } = config();
  const attempts = isRead(init) ? READ_ATTEMPTS : 1;

  let response: Response | null = null;
  let networkError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    networkError = null;
    try {
      response = await fetch(`${url}/rest/v1/${path}`, {
        ...init,
        headers: {
          apikey: serviceKey,
          authorization: `Bearer ${serviceKey}`,
          "content-type": "application/json",
          ...init.headers,
        },
        cache: "no-store",
      });
    } catch (cause) {
      // The connection never completed — no response to inspect.
      networkError = cause;
    }

    // A 4xx is our bug or our data; repeating it only wastes the visitor's time.
    const retriable =
      networkError !== null || (response !== null && response.status >= 500);
    if (!retriable) break;

    if (attempt < attempts) {
      console.warn(
        `[catalog/supabase] leitura falhou (tentativa ${attempt}/${attempts}), repetindo`,
      );
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  if (!response) {
    console.error("[catalog/supabase] sem resposta:", networkError);
    throw new ApiError(
      502,
      "supabase_error",
      "Não foi possível falar com o banco de dados.",
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[catalog/supabase]", response.status, detail);
    throw new ApiError(
      502,
      "supabase_error",
      "Não foi possível falar com o banco de dados.",
    );
  }
  return response;
};

/** PostgREST rejects a duplicate slug; walk until one is free. */
const uniqueSlug = async (base: string, ignoreId?: string) => {
  const response = await rest(
    `products?select=slug&slug=like.${encodeURIComponent(`${base}*`)}`,
  );
  const rows = (await response.json()) as { slug: string }[];
  const taken = new Set(rows.map((row) => row.slug));

  if (ignoreId) {
    const current = await rest(`products?select=slug&id=eq.${ignoreId}`);
    const [row] = (await current.json()) as { slug: string }[];
    if (row) taken.delete(row.slug);
  }

  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
};

const EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif"]);
const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

/**
 * Plants the shipped catalogue the first time the table is found empty — the
 * same promise the file backing makes, so a fresh deploy is not a blank shop.
 *
 * `resolution=ignore-duplicates` on the unique `slug` makes it safe when two
 * requests race on a cold start: the loser's rows are dropped, not duplicated.
 */
const seedIfEmpty = async () => {
  const taken = new Set<string>();
  const rows = catalogSeed.map((input) => {
    const slug = uniqueLocalSlug(slugify(input.name), taken);
    taken.add(slug);
    return { ...toRow(input), slug };
  });

  await rest("products", {
    method: "POST",
    headers: { prefer: "return=minimal,resolution=ignore-duplicates" },
    body: JSON.stringify(rows),
  });
};

/** Slug de-duplication for the seed batch, before any of it reaches the table. */
const uniqueLocalSlug = (base: string, taken: Set<string>) => {
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
};

export const supabaseCatalogStore: CatalogStore = {
  async list() {
    const response = await rest("products?select=*&order=created_at.desc");
    const rows = (await response.json()) as ProductRow[];
    if (rows.length > 0) return rows.map(fromRow);

    await seedIfEmpty();
    const seeded = await rest("products?select=*&order=created_at.desc");
    return ((await seeded.json()) as ProductRow[]).map(fromRow);
  },

  async get(id) {
    const response = await rest(`products?select=*&id=eq.${id}`);
    const [row] = (await response.json()) as ProductRow[];
    return row ? fromRow(row) : null;
  },

  async create(input) {
    const slug = await uniqueSlug(slugify(input.name));
    const response = await rest("products", {
      method: "POST",
      headers: { prefer: "return=representation" },
      body: JSON.stringify({ ...toRow(input), slug }),
    });
    const [row] = (await response.json()) as ProductRow[];
    return fromRow(row);
  },

  async update(id, patch: ProductPatchPayload) {
    const row = toRow(patch);
    if (patch.name !== undefined) {
      Object.assign(row, { slug: await uniqueSlug(slugify(patch.name), id) });
    }

    const response = await rest(`products?id=eq.${id}`, {
      method: "PATCH",
      headers: { prefer: "return=representation" },
      body: JSON.stringify({ ...row, updated_at: new Date().toISOString() }),
    });
    const [updated] = (await response.json()) as ProductRow[];
    if (!updated) {
      throw new ApiError(404, "not_found", "Produto não encontrado.");
    }
    return fromRow(updated);
  },

  async remove(id) {
    const response = await rest(`products?id=eq.${id}`, {
      method: "DELETE",
      headers: { prefer: "return=representation" },
    });
    const rows = (await response.json()) as ProductRow[];
    if (rows.length === 0) {
      throw new ApiError(404, "not_found", "Produto não encontrado.");
    }
  },

  async saveImage(bytes, fileName) {
    const { url, serviceKey, bucket } = config();
    const rawExtension = fileName.split(".").pop()?.toLowerCase() ?? "";
    const extension = EXTENSIONS.has(rawExtension) ? rawExtension : "jpg";
    const objectPath = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;

    const response = await fetch(
      `${url}/storage/v1/object/${bucket}/${objectPath}`,
      {
        method: "POST",
        headers: {
          apikey: serviceKey,
          authorization: `Bearer ${serviceKey}`,
          "content-type": MIME[extension] ?? "image/jpeg",
          "cache-control": "public, max-age=31536000, immutable",
        },
        body: bytes,
      },
    );

    if (!response.ok) {
      const detail = (await response.text().catch(() => "")).slice(0, 200);
      console.error("[catalog/supabase] upload", response.status, detail);
      /*
        The bucket and the service's own words go in the message. This endpoint
        is behind `assertAdmin`, so the only reader is the shop — and a generic
        "não foi possível" left a misconfigured bucket invisible while the API
        had been saying precisely what was wrong on every single attempt.
      */
      throw new ApiError(
        502,
        "upload_failed",
        `A pasta "${bucket}" recusou: HTTP ${response.status} ${detail || ""}`.trim(),
      );
    }

    // Public bucket — the URL is stable and needs no signing.
    return `${url}/storage/v1/object/public/${bucket}/${objectPath}`;
  },
};
