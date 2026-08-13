import sharp from "sharp";

import { getSupabaseConfig } from "@/lib/catalog/supabase-store";
import { invalidateStorageUsage, listStorageFiles } from "@/lib/catalog/storage";

/**
 * Shrinks photos **already in the bucket**, in place.
 *
 * The browser-side resizer only helps photos uploaded after it shipped. The
 * ones already there went up at full phone size, and with Vercel's optimiser
 * off (its quota is spent, see next.config.ts) they reach the customer exactly
 * as they are — the home page was serving 25 MB of images and the site was
 * visibly janky on both a phone and a desktop.
 *
 * Rewrites each object **at the same path**, so no product record changes and
 * no URL breaks. The stored content type becomes WebP while the file name keeps
 * whatever extension it had; that is fine, since the header is what browsers
 * read, and renaming would mean rewriting every product's `images` array.
 *
 * 📖 Docs: obsidian/backend/catalog-store.md
 */

/** Same geometry as the browser-side resizer, so both produce one look. */
const MAX_EDGE = 1600;
const QUALITY = 82;

/** Below this a photo is already small enough to leave alone. */
export const SHRINK_THRESHOLD_BYTES = 400 * 1024;

/**
 * How many are processed per request.
 *
 * Each one is a download, a decode, a resize and an upload of a multi-megabyte
 * file, and a serverless function has a wall clock. Small batches with a
 * "remaining" count let the caller loop instead of gambling on a timeout.
 */
const BATCH = 4;

export interface ShrinkResult {
  processed: number;
  remaining: number;
  freedBytes: number;
  failed: string[];
}

const authHeaders = (serviceKey: string) => ({
  apikey: serviceKey,
  authorization: `Bearer ${serviceKey}`,
});

/** Every stored photo above the threshold, biggest first. */
export const oversizedFiles = async () => {
  const files = await listStorageFiles();
  return files
    .filter((file) => file.bytes > SHRINK_THRESHOLD_BYTES)
    .sort((a, b) => b.bytes - a.bytes);
};

export const shrinkStoredPhotos = async (): Promise<ShrinkResult> => {
  const config = getSupabaseConfig();
  if (!config) {
    return { processed: 0, remaining: 0, freedBytes: 0, failed: [] };
  }

  const targets = await oversizedFiles();
  const batch = targets.slice(0, BATCH);

  let freedBytes = 0;
  let processed = 0;
  const failed: string[] = [];

  for (const file of batch) {
    try {
      const url = `${config.url}/storage/v1/object/${config.bucket}/${file.name}`;

      const download = await fetch(url, {
        headers: authHeaders(config.serviceKey),
        cache: "no-store",
      });
      if (!download.ok) throw new Error(`download ${download.status}`);

      const original = Buffer.from(await download.arrayBuffer());
      const shrunk = await sharp(original)
        // Honours EXIF rotation, exactly as the browser resizer does.
        .rotate()
        .resize({
          width: MAX_EDGE,
          height: MAX_EDGE,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: QUALITY })
        .toBuffer();

      // A photo that grows is left exactly as it was — some are already well
      // compressed, and rewriting them would spend bytes to save none.
      if (shrunk.byteLength >= original.byteLength) {
        processed += 1;
        continue;
      }

      const upload = await fetch(url, {
        method: "PUT",
        headers: {
          ...authHeaders(config.serviceKey),
          "content-type": "image/webp",
          "cache-control": "public, max-age=31536000, immutable",
          "x-upsert": "true",
        },
        body: new Uint8Array(shrunk),
      });
      if (!upload.ok) {
        throw new Error(`upload ${upload.status} ${await upload.text().catch(() => "")}`);
      }

      freedBytes += original.byteLength - shrunk.byteLength;
      processed += 1;
    } catch (error) {
      console.error(`[shrink] ${file.name}:`, error);
      failed.push(file.name);
    }
  }

  invalidateStorageUsage();
  return {
    processed,
    remaining: Math.max(0, targets.length - processed - failed.length),
    freedBytes,
    failed,
  };
};
