/**
 * The catalogue store — one interface, two backings.
 *
 * The admin and the public site only ever talk to this. Which implementation
 * answers depends on whether Supabase credentials are present:
 *
 * - **file** (default) — a JSON file under `.data/`, images written into
 *   `public/assets/produtos/`. Zero setup, works the moment you clone the repo,
 *   and needs a server with a writable disk (local dev, a VPS, Railway).
 * - **supabase** — a `products` table plus a storage bucket. Works anywhere,
 *   including serverless hosts where the filesystem is read-only.
 *
 * Nothing above this line knows which one is in use, so moving from one to the
 * other is a matter of setting environment variables.
 *
 * 📖 Docs: obsidian/backend/catalog-store.md
 */

import type { Product, ProductInput } from "@/types/catalog";
import type { ProductPatchPayload } from "@/lib/catalog/schema";

export interface CatalogStore {
  /** Every product, newest first — including inactive ones. */
  list(): Promise<Product[]>;
  get(id: string): Promise<Product | null>;
  create(input: ProductInput): Promise<Product>;
  /** Throws `ApiError(404)` when the product is gone. */
  update(id: string, patch: ProductPatchPayload): Promise<Product>;
  remove(id: string): Promise<void>;
  /**
   * Persists an uploaded image and returns the URL the site should render.
   * @param fileName - the original name, used only to pick an extension.
   */
  saveImage(bytes: ArrayBuffer, fileName: string): Promise<string>;
}

/** Which backing is active — surfaced in the admin so the mode is never a guess. */
export type CatalogBackend = "file" | "supabase";
