/**
 * File-backed catalogue — the zero-setup default.
 *
 * Products live in `.data/products.json` (gitignored); uploaded images are
 * written into `public/assets/produtos/` so `next/image` serves them like any
 * other static asset.
 *
 * **Requires a writable disk**, so it is for local work and hosts with real
 * filesystems. On a serverless host the writes fail — which is precisely when
 * the Supabase backing takes over.
 *
 * 📖 Docs: obsidian/backend/catalog-store.md
 */

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { catalogSeed } from "@/data/catalog-seed";
import { ApiError } from "@/lib/api";
import { productSchema, slugify } from "@/lib/catalog/schema";
import type { CatalogStore } from "@/lib/catalog/store";
import type { Product, ProductInput } from "@/types/catalog";
import type { ProductPatchPayload } from "@/lib/catalog/schema";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "products.json");
const IMAGE_DIR = path.join(process.cwd(), "public", "assets", "produtos");
const IMAGE_PUBLIC_PATH = "/assets/produtos";

/**
 * Serialises every write. Two admin tabs saving at once would otherwise
 * read-modify-write the same file and one edit would vanish.
 */
let queue: Promise<unknown> = Promise.resolve();

const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
  const run = queue.then(task, task);
  // Keep the chain alive even when a task rejects.
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
};

const readAll = async (): Promise<Product[]> => {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // A hand-edited file is untrusted: drop records that no longer fit.
    return parsed.flatMap((entry) => {
      const result = productSchema.safeParse(entry);
      return result.success ? [result.data as Product] : [];
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
};

const writeAll = async (products: Product[]) => {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(products, null, 2), "utf8");
};

/** Appends `-2`, `-3`… until the slug is free. */
const uniqueSlug = (base: string, taken: Set<string>) => {
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
};

const toRecord = (input: ProductInput, slug: string): Product => {
  const now = new Date().toISOString();
  return { ...input, id: randomUUID(), slug, createdAt: now, updatedAt: now };
};

/** First read on an empty store plants the shop's existing catalogue. */
const ensureSeeded = async (): Promise<Product[]> => {
  const existing = await readAll();
  if (existing.length > 0) return existing;

  const taken = new Set<string>();
  const seeded = catalogSeed.map((input) => {
    const slug = uniqueSlug(slugify(input.name), taken);
    taken.add(slug);
    return toRecord(input, slug);
  });
  await writeAll(seeded);
  return seeded;
};

const EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif"]);

export const fileCatalogStore: CatalogStore = {
  list: () => enqueue(ensureSeeded),

  async get(id) {
    const products = await enqueue(ensureSeeded);
    return products.find((product) => product.id === id) ?? null;
  },

  create(input) {
    return enqueue(async () => {
      const products = await ensureSeeded();
      const taken = new Set(products.map((product) => product.slug));
      const record = toRecord(input, uniqueSlug(slugify(input.name), taken));
      await writeAll([record, ...products]);
      return record;
    });
  },

  update(id, patch: ProductPatchPayload) {
    return enqueue(async () => {
      const products = await ensureSeeded();
      const index = products.findIndex((product) => product.id === id);
      if (index === -1) {
        throw new ApiError(404, "not_found", "Produto não encontrado.");
      }

      const current = products[index];
      const taken = new Set(
        products.filter((_, i) => i !== index).map((product) => product.slug),
      );
      // Renaming re-slugs, so the public URL keeps matching the product.
      const slug =
        patch.name && patch.name !== current.name
          ? uniqueSlug(slugify(patch.name), taken)
          : current.slug;

      const updated: Product = {
        ...current,
        ...patch,
        slug,
        updatedAt: new Date().toISOString(),
      };
      products[index] = updated;
      await writeAll(products);
      return updated;
    });
  },

  remove(id) {
    return enqueue(async () => {
      const products = await ensureSeeded();
      const remaining = products.filter((product) => product.id !== id);
      if (remaining.length === products.length) {
        throw new ApiError(404, "not_found", "Produto não encontrado.");
      }
      await writeAll(remaining);
    });
  },

  async saveImage(bytes, fileName) {
    const rawExtension = path.extname(fileName).slice(1).toLowerCase();
    const extension = EXTENSIONS.has(rawExtension) ? rawExtension : "jpg";
    const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;

    await mkdir(IMAGE_DIR, { recursive: true });
    await writeFile(path.join(IMAGE_DIR, name), Buffer.from(bytes));
    return `${IMAGE_PUBLIC_PATH}/${name}`;
  },
};
