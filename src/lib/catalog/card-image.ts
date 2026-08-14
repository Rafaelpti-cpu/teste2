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
 * Photos that ship with the site rather than living in storage.
 *
 * These came from the old site and are 900×1200 at 60–240 KB apiece. They were
 * assumed small enough to leave alone, which was wrong: with Vercel's optimiser
 * off they are downloaded whole into a 190 CSS px card, and they are most of
 * the catalogue. A `.card.webp` sits next to each cover and hover photo,
 * generated at build-authoring time and committed — the same naming rule as
 * storage, so the grid has one rule rather than two.
 *
 * Only `1.*` and `2.*` have one. Nothing else is ever shown small: the rest of
 * a piece's photos appear only in the dialog's gallery, at full size.
 */
const SEEDED_PREFIX = "/assets/produtos/";
const SEEDED_WITH_CARD = /\/([12])\.[a-z0-9]+$/i;

/**
 * The small rendition's URL, or `null` when there cannot be one.
 *
 * `null` means "use the full photo", which every caller must handle — a piece
 * uploaded before the renditions existed still has none until the maintenance
 * job reaches it.
 */
export const cardImageUrl = (imageUrl: string): string | null => {
  const stored = imageUrl.includes("/storage/v1/object/public/");
  const seeded = imageUrl.startsWith(SEEDED_PREFIX);

  if (seeded && !SEEDED_WITH_CARD.test(imageUrl)) return null;
  if (!stored && !seeded) return null;

  const slash = imageUrl.lastIndexOf("/");
  if (slash < 0) return null;

  const name = imageUrl.slice(slash + 1);
  // A committed rendition is always WebP; a stored one keeps its extension so
  // the name matches what the job wrote.
  const small = seeded
    ? `${name.replace(/\.[^.]+$/, "")}.card.webp`
    : cardObjectName(name);

  return `${imageUrl.slice(0, slash + 1)}${small}`;
};
