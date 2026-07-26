/**
 * Catalogue entry point — picks the backing and exposes it.
 *
 * Server-only: the Supabase implementation reads the service-role key and the
 * file implementation reads `node:fs`, so importing this from a Client
 * Component is a build error, not a silent leak. Keep it that way — the browser
 * reaches the catalogue through `/api/admin/*`, never directly.
 *
 * 📖 Docs: obsidian/backend/catalog-store.md
 */

import { fileCatalogStore } from "@/lib/catalog/file-store";
import {
  getSupabaseConfig,
  supabaseCatalogStore,
} from "@/lib/catalog/supabase-store";
import type { CatalogBackend, CatalogStore } from "@/lib/catalog/store";

/** Supabase when it is configured, the local file otherwise. */
export const getCatalogBackend = (): CatalogBackend =>
  getSupabaseConfig() ? "supabase" : "file";

export const getCatalogStore = (): CatalogStore =>
  getCatalogBackend() === "supabase" ? supabaseCatalogStore : fileCatalogStore;

export type { CatalogBackend, CatalogStore };
