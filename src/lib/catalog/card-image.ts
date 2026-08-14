/**
 * The grid's small rendition of a photo.
 *
 * A product photo is stored at 1100 px, which is what the dialog's gallery
 * needs — that is where someone studies the fabric before asking about it. The
 * grid card is 190 CSS px on a phone. Serving one file to both means the
 * storefront downloads roughly five times the pixels it shows, eight times
 * over: measured at ~100 KB a cover, which on a throttled 4G pipe is the four
 * seconds the shop described as the pieces "coming in dragging".
 *
 * So each upload stores two objects. The small one is derived by name rather
 * than recorded on the product, which keeps `images` untouched — no migration,
 * no second field to fall out of step, and a photo saved before this existed
 * still resolves (see `CARD_SUFFIX` below).
 *
 * 📖 Docs: obsidian/backend/catalog-store.md
 */

/**
 * Width of the grid rendition.
 *
 * 500 covers 190 CSS px at the 2.6× of a mid-range phone with room to spare,
 * and the desktop grid card at 288 CSS px on a 1× display.
 */
export const CARD_EDGE = 500;

/**
 * Inserted before the extension: `abc123.webp` → `abc123.card.webp`.
 *
 * A suffix in the same flat namespace rather than a `card/` folder, because
 * Supabase's listing returns one level at a time — a folder would hide these
 * from the storage gauge and the sweep would have to learn to walk into it.
 */
const CARD_SUFFIX = ".card";

/** `abc123.webp` → `abc123.card.webp`. */
export const cardObjectName = (name: string): string => {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return `${name}${CARD_SUFFIX}`;
  return `${name.slice(0, dot)}${CARD_SUFFIX}${name.slice(dot)}`;
};

/** `true` for a generated small rendition rather than an uploaded photo. */
export const isCardObject = (name: string): boolean =>
  name.includes(`${CARD_SUFFIX}.`) || name.endsWith(CARD_SUFFIX);

/**
 * `abc123.card.webp` → `abc123.webp`.
 *
 * The sweep needs this: a rendition is not waste when the photo it was made
 * from is still in the catalogue, and no product record points at one.
 */
export const parentObjectName = (name: string): string =>
  name.replace(`${CARD_SUFFIX}.`, ".").replace(new RegExp(`${CARD_SUFFIX}$`), "");

/**
 * The small rendition's URL, or `null` when there cannot be one.
 *
 * `null` for the seeded photos under `public/`, which are already small and
 * are served by the site rather than from storage.
 */
export const cardImageUrl = (imageUrl: string): string | null => {
  if (!imageUrl.includes("/storage/v1/object/public/")) return null;
  const slash = imageUrl.lastIndexOf("/");
  if (slash < 0) return null;
  return `${imageUrl.slice(0, slash + 1)}${cardObjectName(imageUrl.slice(slash + 1))}`;
};
