/**
 * Shrinks a photo in the browser, before it is ever uploaded.
 *
 * This runs on the shop's phone, standing next to the rail. It matters more
 * than it looks:
 *
 * - **The upload finishes.** A 4 MB photo over shop wifi or 4G is slow enough
 *   to be abandoned, and sometimes fails outright. ~200 KB is instant.
 * - **The storage lasts.** Supabase's free GB is ~285 photos at phone size and
 *   ~5 000 at this size.
 * - **The page stays light.** Vercel's image optimiser is off (its free quota
 *   is spent and it answers 402), so whatever is uploaded is exactly what a
 *   customer downloads. Without this, that would be megabytes per photo.
 *
 * 1600 px on the long edge is deliberately generous: the largest a photo is
 * ever displayed is the 32 rem gallery, 512 CSS px, which is 1024 on a 2× phone.
 * There is room to change the layout without going back to the camera.
 *
 * 📖 Docs: obsidian/backend/admin-area.md
 */

/** Longest edge kept, in pixels. */
const MAX_EDGE = 1600;
/** WebP quality. 0.82 is where the seams stop being visible on fabric. */
const QUALITY = 0.82;

/** Below this, resizing is not worth a re-encode. */
const SKIP_BELOW_BYTES = 300 * 1024;

const canDecode = (file: File) =>
  typeof createImageBitmap === "function" && file.type.startsWith("image/");

/**
 * Returns a smaller WebP, or the original file when shrinking is impossible or
 * pointless.
 *
 * **Never throws.** A photo that cannot be resized must still reach the site —
 * the shop's job is to sell the piece, not to satisfy this function.
 */
export const shrinkForUpload = async (file: File): Promise<File> => {
  if (file.size <= SKIP_BELOW_BYTES || !canDecode(file)) return file;

  try {
    // `from-image` applies the EXIF rotation, so a photo taken sideways is not
    // uploaded sideways — the browser's own orientation handling does not
    // survive being drawn to a canvas.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALITY),
    );
    // Some browsers answer `null` for WebP; others hand back something larger
    // than the original, which happens with photos that are already compressed.
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp", lastModified: Date.now() });
  } catch {
    return file;
  }
};
