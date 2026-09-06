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
 * The cap is on **width**, because width is what every slot on this site is
 * sized by — see `MAX_WIDTH` for the measurements that moved it off the
 * longest edge, and for what it cost.
 *
 * 📖 Docs: obsidian/backend/admin-area.md
 */

/**
 * Widest a photo is kept, in pixels.
 *
 * The cap used to be on the **longest** edge, and that is the wrong axis. Every
 * slot on this site is sized by width — the photo fills the column and the
 * height follows — so on a portrait photo the longest edge is the height, and
 * capping it decides the width by accident.
 *
 * Measured on the live bucket, a 30-photo sample: every processed photo came
 * back exactly 1100 px tall and between 500 and 1028 px **wide**. Median 761.
 * Sixteen of the thirty were under 800. The worst was 500x1100 — a photo half
 * a thousand pixels wide.
 *
 * Against what the page asks for: the product gallery is ~341 CSS px on a
 * 393 px phone, which a 3x screen renders at 1023 device px. A 619 px photo —
 * the most common width in the sample — is stretched 1.65x to fill it, and the
 * 500 px one 2.05x. That is the "fotos meio tremidas" the shop reported, and
 * it was arithmetic, not compression.
 *
 * 1100 of width is what the largest slot actually needs: 1023 for the phone
 * gallery above, ~1140 for the desktop two-column layout at 2x. Measured cost
 * of the change over eight reference photos: 58 KB -> 106 KB for the photo
 * somebody opened on purpose. The grid card, which is what everyone downloads
 * eight at a time, is capped at 500 px either way and moved 29 KB -> 33 KB.
 */
const MAX_WIDTH = 1100;

/**
 * A bound on height, not a target.
 *
 * At 1100 wide a 9:16 photo — the most common shape in the shop's uploads — is
 * 1956 tall, so this never binds in practice. It exists so one very tall crop
 * cannot turn into a ten-megapixel upload.
 */
const MAX_HEIGHT = 2400;

/** WebP quality. 0.82 is where the seams stop being visible on fabric. */
const QUALITY = 0.82;

/**
 * A photo already within the pixel caps is re-encoded only above this.
 *
 * Two different reasons to touch a file, and both are needed. Too many pixels
 * is the one this module is named for. Too many *bytes* at acceptable pixels is
 * the other — a 900x1200 PNG straight from a phone can be megabytes, and turning
 * it into WebP at the same size is most of the saving.
 *
 * Below both, the original is handed back untouched. WebP is lossy: a re-encode
 * that changes nothing still costs a generation of quality.
 */
const REENCODE_ABOVE_BYTES = 300 * 1024;

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
  if (!canDecode(file)) return file;

  try {
    // `from-image` applies the EXIF rotation, so a photo taken sideways is not
    // uploaded sideways — the browser's own orientation handling does not
    // survive being drawn to a canvas.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

    const scale = Math.min(
      1,
      MAX_WIDTH / bitmap.width,
      MAX_HEIGHT / bitmap.height,
    );

    // Small enough and light enough: hand the original back rather than pay a
    // generation of WebP for a file that is already fine.
    if (scale === 1 && file.size <= REENCODE_ABOVE_BYTES) {
      bitmap.close();
      return file;
    }

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
    // Defaults to "low", which is a real setting and not a hint: on the ~3x
    // reduction a phone photo needs, the cheap filter samples too few source
    // pixels and fabric weave and print edges come out crawling. The shop is
    // selling the texture.
    context.imageSmoothingQuality = "high";
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
