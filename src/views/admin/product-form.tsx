"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createProduct, updateProduct } from "@/lib/admin/client";
import { DEFAULT_CATEGORIES } from "@/types/catalog";
import type { Product, ProductInput } from "@/types/catalog";

import { CategoryField } from "./category-field";
import { ColorEditor } from "./color-editor";
import { ImagePicker } from "./image-picker";
import { SizeEditor } from "./size-editor";

export interface ProductFormProps {
  /** Absent when creating. */
  product?: Product;
  /** Sections already in use, offered before inventing a new one. */
  categories: string[];
}

const EMPTY: ProductInput = {
  name: "",
  description: "",
  price: 0,
  category: "Feminino",
  sizes: [],
  colors: [],
  images: [],
  active: true,
};

const field =
  "w-full rounded-control border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus-visible:border-action-primary";

export const ProductForm = ({ product, categories }: ProductFormProps) => {
  const router = useRouter();
  const [draft, setDraft] = useState<ProductInput>(
    product ?? { ...EMPTY, category: categories[0] ?? DEFAULT_CATEGORIES[0] },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (product) {
        await updateProduct(product.id, draft);
      } else {
        await createProduct(draft);
      }
      router.push("/admin");
      // The list is a Server Component: without this it re-renders from cache.
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex max-w-[46rem] flex-col gap-7">
      {/*
        Photos first, because that is where the work actually starts: the shop
        adds pieces from a phone, standing next to the rail, and the photo is
        both the first thing they have and the one field that gates saving.
        Asking for a name before the picture is asking them to describe
        something they have not looked at yet.
      */}
      <ImagePicker value={draft.images} onChange={(images) => set("images", images)} />

      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Nome da peça
        </label>
        <input
          id="name"
          required
          maxLength={120}
          value={draft.name}
          onChange={(event) => set("name", event.target.value)}
          placeholder="Calça wide jeans marrom"
          className={field}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Descrição
        </label>
        <textarea
          id="description"
          rows={4}
          maxLength={2000}
          value={draft.description}
          onChange={(event) => set("description", event.target.value)}
          placeholder="Tecido, caimento, com o que combina…"
          className={`${field} resize-y`}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="price" className="text-sm font-medium text-foreground">
            Preço (R$)
          </label>
          <input
            id="price"
            type="number"
            required
            min={0}
            step="0.01"
            inputMode="decimal"
            value={Number.isFinite(draft.price) ? draft.price : ""}
            onChange={(event) => set("price", event.target.valueAsNumber)}
            className={field}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="text-sm font-medium text-foreground">
            Categoria
          </label>
          <CategoryField
            value={draft.category}
            onChange={(category) => set("category", category)}
            options={categories}
            className={field}
          />
        </div>
      </div>

      <SizeEditor value={draft.sizes} onChange={(sizes) => set("sizes", sizes)} />
      <ColorEditor value={draft.colors} onChange={(colors) => set("colors", colors)} />

      <label className="flex items-center gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(event) => set("active", event.target.checked)}
          className="size-4 accent-[var(--action-primary)]"
        />
        Mostrar esta peça no site
      </label>

      {error && (
        <p role="alert" className="text-sm text-foreground-accent">
          {error}
        </p>
      )}

      {/*
        Sticky on a phone: the form is long, and scrolling back to the bottom
        after every edit is the kind of friction that stops a shop from keeping
        the catalogue current.
      */}
      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t border-border-subtle bg-background/95 px-1 py-4 backdrop-blur-sm">
        <button
          type="submit"
          disabled={saving || draft.images.length === 0}
          className="flex-1 rounded-pill bg-action-primary px-6 py-3.5 text-sm font-medium text-action-primary-foreground transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-action-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
        >
          {saving ? "Salvando…" : product ? "Salvar alterações" : "Adicionar peça"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-pill border border-border-strong px-6 py-3.5 text-sm transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-surface-inverse hover:text-foreground-inverse"
        >
          Cancelar
        </button>
        {draft.images.length === 0 && (
          <span className="w-full text-xs text-foreground-muted sm:w-auto">
            Escolha ao menos uma foto para poder salvar.
          </span>
        )}
      </div>
    </form>
  );
};
