import { assertAdmin } from "@/lib/admin/auth";
import { handle } from "@/lib/api";
import { shrinkStoredPhotos } from "@/lib/catalog/shrink-stored";

/**
 * `POST /api/admin/espaco/encolher` — shrinks stored photos, a few per call.
 *
 * Returns `remaining`, so the caller loops rather than betting one request
 * against a serverless wall clock. Idempotent: a photo already small enough is
 * below the threshold and is never picked again.
 *
 * 📖 Docs: obsidian/backend/catalog-store.md
 */

/** Resizing multi-megabyte photos needs longer than the default. */
export const maxDuration = 60;

export const POST = handle(async () => {
  await assertAdmin();
  return shrinkStoredPhotos();
});
