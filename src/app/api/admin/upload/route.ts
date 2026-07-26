import { assertAdmin } from "@/lib/admin/auth";
import { ApiError, handle } from "@/lib/api";
import { getCatalogStore } from "@/lib/catalog";

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

  const url = await getCatalogStore().saveImage(
    await file.arrayBuffer(),
    file.name,
  );
  return { url };
});
