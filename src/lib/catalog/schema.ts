/**
 * Validation for everything that enters the catalogue.
 *
 * Shared by the API routes (which parse untrusted request bodies) and the file
 * store (which parses whatever is on disk — a hand-edited JSON file is
 * untrusted too). One schema, so the two can never drift.
 */

import { z } from "zod";

import { PRODUCT_CATEGORIES } from "@/types/catalog";

const colorSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome à cor.").max(40),
  /** `<input type="color">` always emits this form, so it is safe to require. */
  hex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida."),
});

/**
 * The fields, **without defaults**.
 *
 * Defaults belong to creation only. `.partial()` does not strip them, so a
 * patch schema built from a defaulted shape fills every absent key with its
 * default — a request that only flips `active` would arrive carrying
 * `sizes: []` and wipe the grade the shop had typed in. Keeping defaults out of
 * the base is what makes "absent" mean "leave it alone".
 */
const fields = {
  name: z.string().trim().min(1, "O nome é obrigatório.").max(120),
  description: z.string().trim().max(2000),
  price: z
    .number({ message: "Informe um preço." })
    .nonnegative("O preço não pode ser negativo.")
    .max(1_000_000),
  category: z.enum(PRODUCT_CATEGORIES),
  sizes: z.array(z.string().trim().min(1).max(12)).max(40),
  colors: z.array(colorSchema).max(40),
  /** The gallery. First entry is the cover, so order is meaningful. */
  images: z
    .array(z.string().trim().min(1))
    .min(1, "Escolha ao menos uma foto.")
    .max(12),
  active: z.boolean(),
};

/** Creating a product — the optional halves fall back to sensible empties. */
export const productInputSchema = z.object({
  ...fields,
  description: fields.description.default(""),
  sizes: fields.sizes.default([]),
  colors: fields.colors.default([]),
  active: fields.active.default(true),
});

/** Editing — every field optional, and an absent key changes nothing. */
export const productPatchSchema = z.object(fields).partial();

/** A stored record, as read back from disk or from the database. */
export const productSchema = productInputSchema.extend({
  id: z.string().min(1),
  slug: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProductInputPayload = z.infer<typeof productInputSchema>;
export type ProductPatchPayload = z.infer<typeof productPatchSchema>;

/** "Calça Wide Jeans Marrom" → "calca-wide-jeans-marrom". */
export const slugify = (value: string) =>
  value
    .normalize("NFD")
    // Combining marks, written as escapes — the literal characters are
    // invisible in an editor and get mangled by copy-paste.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "produto";
