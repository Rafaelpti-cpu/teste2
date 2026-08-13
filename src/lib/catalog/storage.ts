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

/**
 * Page size for the bucket listing.
 *
 * 100, not 1000: that is the value Supabase's own client sends and the one
 * their docs use, and a larger page is the first thing to suspect when a
 * listing that works against a stub fails against the real service. At a few
 * hundred photos this costs two or three round trips and buys certainty.
 */
const PAGE = 100;

interface StorageObject {
  name: string;
  metadata: { size?: number } | null;
}

/** One file in the bucket. */
export interface StoredFile {
  name: string;
  bytes: number;
}

/** Walks the whole bucket. Flat by construction — `saveImage` writes no folders. */
/** Public name for the same walk, used by the shrink job. */
export const listStorageFiles = (): Promise<StoredFile[]> => listAll();

const listAll = async (): Promise<StoredFile[]> => {
  const config = getSupabaseConfig();
  if (!config) return [];

  const files: StoredFile[] = [];
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
        // `sortBy` is what supabase-js always sends; sending it too removes one
        // more difference between this and the client the service is tested with.
        body: JSON.stringify({
          prefix: "",
          limit: PAGE,
          offset,
          sortBy: { column: "name", order: "asc" },
        }),
        cache: "no-store",
      },
    );
    if (!response.ok) {
      const detail = (await response.text().catch(() => "")).slice(0, 300);
      /*
        The bucket name is in the message because the first time this fired in
        production it said "Bucket not found" for a bucket that demonstrably
        existed — the app was simply looking under another name, set in
        SUPABASE_STORAGE_BUCKET. Naming what was searched for turns that from a
        deploy-cycle guessing game into one glance.
      */
      throw new Error(
        `Pasta "${config.bucket}" — HTTP ${response.status} — ${detail || "sem detalhe"}`,
      );
    }

    const page = (await response.json()) as StorageObject[];
    for (const object of page) {
      // Folder placeholders come back with no metadata; they weigh nothing.
      if (!object.metadata) continue;
      files.push({ name: object.name, bytes: object.metadata.size ?? 0 });
    }

    if (page.length < PAGE) break;
    offset += PAGE;
  }

  return files;
};

/** Deletes files by name. Returns how many the bucket says it removed. */
export const deleteStorageObjects = async (
  names: string[],
): Promise<number> => {
  const config = getSupabaseConfig();
  if (!config || names.length === 0) return 0;

  const response = await fetch(
    `${config.url}/storage/v1/object/${config.bucket}`,
    {
      method: "DELETE",
      headers: {
        apikey: config.serviceKey,
        authorization: `Bearer ${config.serviceKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ prefixes: names }),
    },
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Storage delete ${response.status}: ${detail}`);
  }

  const removed = (await response.json()) as unknown[];
  invalidateStorageUsage();
  return Array.isArray(removed) ? removed.length : names.length;
};

/** The object name inside the bucket, or `null` for anything not stored there. */
export const objectNameOf = (imageUrl: string): string | null => {
  const config = getSupabaseConfig();
  if (!config) return null;
  const prefix = `${config.url}/storage/v1/object/public/${config.bucket}/`;
  if (!imageUrl.startsWith(prefix)) return null;
  return decodeURIComponent(imageUrl.slice(prefix.length));
};

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
    const all = await listAll();
    const usedBytes = all.reduce((sum, file) => sum + file.bytes, 0);
    const files = all.length;

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

/** How much space one piece's photos take. */
export interface ProductUsage {
  id: string;
  name: string;
  bytes: number;
  photos: number;
}

export interface StorageReport {
  usage: StorageUsage;
  /** Heaviest first — the ones worth looking at when space runs low. */
  products: ProductUsage[];
  /** Every file in the bucket, so the screen can spot the heavy ones. */
  files: StoredFile[];
  /** Files in the bucket that no piece points at. Pure waste. */
  orphans: StoredFile[];
  orphanBytes: number;
}

/**
 * The full picture, for the "Espaço" tab.
 *
 * Orphans are the interesting half. Deleting a piece removes its row and leaves
 * its photos in the bucket, and replacing a photo in the form abandons the old
 * one — so a bucket grows quietly, and the only evidence is a number going up.
 *
 * Sweeping them is deliberately a **manual, visible action** rather than
 * something `remove()` does on the way past. A file is an orphan only relative
 * to the catalogue as it is *right now*; if a read of the products table ever
 * came back short, deleting on that basis would destroy photos that are still
 * in use. A button the shop presses, showing exactly what will go, cannot be
 * triggered by a bad read at three in the morning.
 *
 * 📖 Docs: obsidian/backend/catalog-store.md
 */
/**
 * Why the report is not available, when it is not.
 *
 * A discriminated union rather than `null`, because the two reasons need
 * different words on screen: "photos live on disk here" is reassuring and
 * "I could not read the bucket" is a problem. Conflating them printed a
 * sentence that contradicted the backend label three lines above it.
 *
 * `detail` carries the failure to the admin — the only reader — because the
 * server log it would otherwise die in is not somewhere the shop can look, and
 * asking them to relay a status code beats guessing across a deploy cycle.
 */
export type StorageReportResult =
  | { status: "ok"; report: StorageReport }
  | { status: "unsupported" }
  | { status: "error"; detail: string };

export const getStorageReport = async (
  products: { id: string; name: string; images: string[] }[],
): Promise<StorageReportResult> => {
  if (!getSupabaseConfig()) return { status: "unsupported" };

  try {
    /*
      One listing, and the usage is derived from it rather than read from
      `getStorageUsage()`.

      That is not a micro-optimisation, it is correctness. The cache is a module
      variable, and Next bundles the route handler and the page into separate
      server chunks — each gets its own copy, so `invalidateStorageUsage()`
      after a sweep clears one and leaves the other. The page then rendered
      "no orphans left" above a gauge still claiming the old total. Anything
      that reads both numbers has to read them from the same listing.
    */
    const files = await listAll();
    const limitBytes = getStorageLimitBytes();
    const usedBytes = files.reduce((sum, file) => sum + file.bytes, 0);
    const usage: StorageUsage = {
      usedBytes,
      limitBytes,
      files: files.length,
      percent: Math.min(100, Math.round((usedBytes / limitBytes) * 100)),
    };
    // This chunk's cache is fresh now; hand it the truth on the way past.
    cache = { at: Date.now(), value: usage };

    const sizes = new Map(files.map((file) => [file.name, file.bytes]));

    const used = new Set<string>();
    const perProduct: ProductUsage[] = [];

    for (const product of products) {
      let bytes = 0;
      let photos = 0;
      for (const image of product.images) {
        const name = objectNameOf(image);
        // Seeded photos live in `public/` and cost the bucket nothing.
        if (!name) continue;
        used.add(name);
        bytes += sizes.get(name) ?? 0;
        photos += 1;
      }
      if (photos > 0) {
        perProduct.push({ id: product.id, name: product.name, bytes, photos });
      }
    }

    const orphans = files.filter((file) => !used.has(file.name));

    return {
      status: "ok",
      report: {
        usage,
        files,
        products: perProduct.sort((a, b) => b.bytes - a.bytes),
        orphans,
        orphanBytes: orphans.reduce((sum, file) => sum + file.bytes, 0),
      },
    };
  } catch (error) {
    console.error("[catalog/storage] report unavailable:", error);
    return {
      status: "error",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
};
