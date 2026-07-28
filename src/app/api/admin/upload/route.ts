import { assertAdmin } from "@/lib/admin/auth";
import { ApiError, handle } from "@/lib/api";
import { getCatalogStore } from "@/lib/catalog";
import {
  getStorageUsage,
  invalidateStorageUsage,
} from "@/lib/catalog/storage";

/**
 * Product photo upload. Multipart rather than JSON — a base64 body would be a
 * third larger and would have to be held in memory twice.
 */

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export const POST = handle(async (req) => {
  await assertAdmin();

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    throw new ApiError(400, "missing_file", "Nenhuma foto foi enviada.");
  }
  if (!ACCEPTED.has(file.type)) {
    throw new ApiError(
      415,
      "unsupported_type",
      "Formato não aceito. Use JPG, PNG, WebP, AVIF ou GIF.",
    );
  }
  if (file.size > MAX_BYTES) {
    throw new ApiError(413, "file_too_large", "A foto passa de 8 MB.");
  }

  /*
    Refuse the upload that would go over the plan's storage instead of letting
    Supabase reject it — its error arrives as a 400 with a message nobody can
    act on, halfway through a batch, with some photos already saved.

    `null` means the usage could not be read (file backing, or the listing
    failed). Unknown must never block the shop from working, so it passes.
  */
  const usage = await getStorageUsage();
  if (usage && usage.usedBytes + file.size > usage.limitBytes) {
    throw new ApiError(
      507,
      "storage_full",
      "O espaço de fotos acabou. Apague fotos de peças antigas para liberar, ou aumente o plano do banco.",
    );
  }

  const url = await getCatalogStore().saveImage(
    await file.arrayBuffer(),
    file.name,
  );
  invalidateStorageUsage();
  return { url };
});
