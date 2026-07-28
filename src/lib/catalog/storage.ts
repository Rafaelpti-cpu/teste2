/**
 * How much of the photo storage is used.
 *
 * Exists so the shop finds out it is running out of room *before* an upload
 * fails, and so the admin can refuse the upload that would go over instead of
 * letting Supabase reject it with an error nobody can act on.
 *
 * Only meaningful on the Supabase backing — the file backing writes to a real
 * disk, whose size is the host's problem and not a number worth inventing.
 *
 * 📖 Docs: obsidian/backend/catalog-store.md
 */

import { getSupabaseConfig } from "@/lib/catalog/supabase-store";

export interface StorageUsage {
  usedBytes: number;
  limitBytes: number;
  files: number;
  /** 0–100, rounded. */
  percent: number;
}

/** Supabase's free tier. Override when the plan changes, in one variable. */
const DEFAULT_LIMIT_MB = 1024;

/**
 * The listing costs a round trip and the number moves only when a photo is
 * added, so a minute of staleness is free. Without this, every admin page load
 * would list the whole bucket.
 */
const CACHE_MS = 60_000;

let cache: { at: number; value: StorageUsage } | null = null;

/** Storage lists a page at a time; the bucket is flat, so this walks it all. */
const PAGE = 1000;

interface StorageObject {
  name: string;
  metadata: { size?: number } | null;
}

export const getStorageLimitBytes = (): number => {
  const configured = Number(process.env.SUPABASE_STORAGE_LIMIT_MB);
  const megabytes =
    Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_LIMIT_MB;
  return megabytes * 1024 * 1024;
};

/** `null` when storage is not Supabase-backed, or when the listing fails. */
export const getStorageUsage = async (): Promise<StorageUsage | null> => {
  const config = getSupabaseConfig();
  if (!config) return null;

  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;

  try {
    let usedBytes = 0;
    let files = 0;
    let offset = 0;

    for (;;) {
      const response = await fetch(
        `${config.url}/storage/v1/object/list/${config.bucket}`,
        {
          method: "POST",
          headers: {
            apikey: config.serviceKey,
            authorization: `Bearer ${config.serviceKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ prefix: "", limit: PAGE, offset }),
          cache: "no-store",
        },
      );
      if (!response.ok) throw new Error(`Storage ${response.status}`);

      const page = (await response.json()) as StorageObject[];
      for (const object of page) {
        // Folder placeholders come back with no metadata; they weigh nothing.
        if (!object.metadata) continue;
        usedBytes += object.metadata.size ?? 0;
        files += 1;
      }

      if (page.length < PAGE) break;
      offset += PAGE;
    }

    const limitBytes = getStorageLimitBytes();
    const value: StorageUsage = {
      usedBytes,
      limitBytes,
      files,
      percent: Math.min(100, Math.round((usedBytes / limitBytes) * 100)),
    };
    cache = { at: Date.now(), value };
    return value;
  } catch (error) {
    // Never break the admin over a gauge. The upload guard treats `null` as
    // "unknown", and unknown must not block the shop from working.
    console.error("[catalog/storage] usage unavailable:", error);
    return null;
  }
};

/** Called after a successful upload, so the gauge moves immediately. */
export const invalidateStorageUsage = () => {
  cache = null;
};
