/**
 * The catalogue's shared shapes.
 *
 * Lives in `types/` because the public site, the admin views and the API layer
 * all speak this language — it is not owned by any one of them.
 */

/**
 * The sections the shop started with — a **suggested order**, not a closed set.
 *
 * These four are offered in the admin and, when present, are listed first and
 * in this order everywhere on the site, because that is the order the shop
 * arranged its floor in. Anything the shop invents afterwards is a category
 * like any other and follows them alphabetically.
 */
export const DEFAULT_CATEGORIES = [
  "Feminino",
  "Masculino",
  "Infantil",
  "Tênis",
] as const;

/**
 * Free text, not a union.
 *
 * It was a union of the four above until the shop asked to add sections from
 * the phone, which is the whole point of having an admin — a new section should
 * not need a developer, a deploy, and a person who knows what `z.enum` is.
 */
export type ProductCategory = string;

/** Longest a category name may be. Kept short so the filter chips stay chips. */
export const CATEGORY_MAX_LENGTH = 40;

/**
 * The categories actually in use, in the order the site should show them:
 * the defaults first in their canonical order, then the rest alphabetically.
 *
 * Derived from the catalogue rather than stored, so a section appears when its
 * first piece does and disappears with its last — there is no separate list to
 * fall out of step.
 */
export const categoriesOf = (
  products: { category: ProductCategory }[],
): ProductCategory[] => {
  const present = new Set(products.map((product) => product.category));
  const defaults = DEFAULT_CATEGORIES.filter((category) =>
    present.has(category),
  );
  const extra = [...present]
    .filter((category) => !DEFAULT_CATEGORIES.includes(category as never))
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  return [...defaults, ...extra];
};

/** A colourway. `hex` drives the swatch; `name` is what the customer reads. */
export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  /** URL-safe identifier derived from the name; unique across the catalogue. */
  slug: string;
  name: string;
  description: string;
  /** Price in BRL. Formatted for display by `formatPrice`. */
  price: number;
  category: ProductCategory;
  /** Free-form, ordered as the shop wants them shown — "P", "M", "38"… */
  sizes: string[];
  colors: ProductColor[];
  /**
   * The photo gallery, in the order the shop arranged it. Never empty.
   * Each entry is an absolute path under `public/` or a full storage URL.
   * The **first** is the cover — see `coverImage`.
   */
  images: string[];
  /** Hidden from the public site when `false`, but kept in the admin. */
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Everything the admin can set. The store owns id, slug and timestamps. */
export type ProductInput = Omit<
  Product,
  "id" | "slug" | "createdAt" | "updatedAt"
>;

/**
 * The photo that represents the piece — first in the gallery.
 *
 * `images` is validated non-empty, so this always resolves; the fallback only
 * guards a record that reached the UI without going through the schema.
 */
export const coverImage = (product: Pick<Product, "images">) =>
  product.images[0] ?? "";

/** The photo shown on hover, when the shop uploaded more than one. */
export const hoverImage = (product: Pick<Product, "images">) =>
  product.images[1] ?? null;

/** Common size runs, offered as one-tap presets in the admin. */
export const SIZE_PRESETS: Record<string, string[]> = {
  Roupa: ["PP", "P", "M", "G", "GG", "XG"],
  Numérico: ["36", "38", "40", "42", "44", "46"],
  Calçado: ["33", "34", "35", "36", "37", "38", "39", "40"],
  Infantil: ["2", "4", "6", "8", "10", "12", "14"],
};
