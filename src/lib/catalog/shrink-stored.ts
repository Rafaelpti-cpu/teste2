import sharp from "sharp";

import { getSupabaseConfig } from "@/lib/catalog/supabase-store";
import { invalidateStorageUsage, listStorageFiles } from "@/lib/catalog/storage";

/**
 * Maintenance pass over the photos already in the bucket. Two jobs, one loop.
 *
 * **Size.** The browser-side resizer only helps photos uploaded after it
 * shipped; the ones already there went up at full phone size. With Vercel's
 * optimiser off (quota spent, see next.config.ts) they reach the customer
 * exactly as stored — the home page was serving 25 MB of images.
 *
 * **Caching.** Every stored object came back `Cache-Control: no-cache` with
 * `CF-Cache-Status: MISS`, so no browser kept a photo between visits and the
 * CDN went to origin every single time — 0.6 s to first byte, per image, for
 * everyone. The upload header said `public, max-age=31536000, immutable`;
 * Supabase parses that value itself and stores `no-cache` when it does not
 * recognise the shape. Plain `max-age=<seconds>` is the form it accepts.
 *
 * Both are fixed by rewriting the object **at the same path**, so no product
 * record changes and no URL breaks.
 *
 * 📖 Docs: obsidian/backend/catalog-store.md
 */

/**
 * Same geometry as the browser-side resizer, so both produce one look.
 * See `resize-image.ts` for why 1100 and not a rounder number.
 */
const MAX_EDGE = 1100;
const QUALITY = 82;

/**
 * Below this a photo is left at its current size.
 *
 * 150 KB, down from 400. At 1100 px a garment photo lands around 90–140 KB, so
 * the old threshold would have declared every already-shrunk photo finished and
 * skipped the re-pass that this size change needs.
 */
export const SHRINK_THRESHOLD_BYTES = 150 * 1024;

/** A year. Names are unique per upload, so the content never changes under one. */
export const CACHE_CONTROL = "max-age=31536000";

/**
 * How many are processed per request.
 *
 * Each is a download, a decode, a resize and an upload of a possibly
 * multi-megabyte file, and a serverless function has a wall clock. Small
 * batches with a "remaining" count let the caller loop instead of gambling on
 * a timeout.
 */
const BATCH = 4;

/** How many cache headers are inspected at once while surveying. */
const PROBE_CONCURRENCY = 20;

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

/** `true` when the stored object is missing the long cache header. */
const needsCacheFix = async (publicUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(publicUrl, { method: "HEAD", cache: "no-store" });
    const header = response.headers.get("cache-control") ?? "";
    return !/max-age=\d{5,}/.test(header);
  } catch {
    // Unknown means leave it alone — a survey failure must not cause a rewrite.
    return false;
  }
};

/**
 * Files that would benefit from a rewrite: too big, or not cacheable.
 *
 * Surveyed rather than assumed, so a second run finds nothing and the button
 * stops offering work that no longer exists.
 */
export const filesNeedingWork = async () => {
  const config = getSupabaseConfig();
  if (!config) return [];

  const files = await listStorageFiles();
  const out: { name: string; bytes: number; oversized: boolean }[] = [];

  for (let i = 0; i < files.length; i += PROBE_CONCURRENCY) {
    const slice = files.slice(i, i + PROBE_CONCURRENCY);
    const checks = await Promise.all(
      slice.map(async (file) => {
        const oversized = file.bytes > SHRINK_THRESHOLD_BYTES;
        if (oversized) return { file, oversized, needed: true };
        const url = `${config.url}/storage/v1/object/public/${config.bucket}/${encodeURIComponent(file.name)}`;
        return { file, oversized, needed: await needsCacheFix(url) };
      }),
    );
    for (const check of checks) {
      if (check.needed) {
        out.push({ ...check.file, oversized: check.oversized });
      }
    }
  }

  // Heaviest first: the biggest wins land in the first batch.
  return out.sort((a, b) => b.bytes - a.bytes);
};

export const shrinkStoredPhotos = async (): Promise<ShrinkResult> => {
  const config = getSupabaseConfig();
  if (!config) {
    return { processed: 0, remaining: 0, freedBytes: 0, failed: [] };
  }

  const targets = await filesNeedingWork();
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

      const originalType = download.headers.get("content-type") ?? "image/webp";
      const original = Buffer.from(await download.arrayBuffer());

      let body: Buffer<ArrayBufferLike> = original;
      let type = originalType;

      if (file.oversized) {
        /*
          Decided on pixels, not bytes.

          Byte size alone would re-encode a photo that is already the right
          dimensions, and WebP is lossy — running this button twice would
          quietly degrade every image, a third time more so. Measuring the
          actual width makes the job idempotent: once a photo is within
          MAX_EDGE it is never re-compressed again, only rewritten if its cache
          header still needs fixing.
        */
        const { width = 0, height = 0 } = await sharp(original).metadata();
        const tooBig = Math.max(width, height) > MAX_EDGE;

        if (tooBig) {
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

          // A photo that grows keeps its original bytes — some are already well
          // compressed — but still gets rewritten, for the cache header.
          if (shrunk.byteLength < original.byteLength) {
            body = shrunk;
            type = "image/webp";
          }
        }
      }

      const upload = await fetch(url, {
        method: "PUT",
        headers: {
          ...authHeaders(config.serviceKey),
          "content-type": type,
          "cache-control": CACHE_CONTROL,
          "x-upsert": "true",
        },
        body: new Uint8Array(body),
      });
      if (!upload.ok) {
        throw new Error(`upload ${upload.status} ${await upload.text().catch(() => "")}`);
      }

      freedBytes += original.byteLength - body.byteLength;
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
