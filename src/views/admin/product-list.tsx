"use client";

import { useMemo, useState } from "react";

import { PRODUCT_CATEGORIES, type Product, type ProductCategory } from "@/types/catalog";

import { ProductRow } from "./product-row";

export interface ProductListProps {
  products: Product[];
}

/** Ignores case and accents, so "tenis" finds "Tênis". */
const normalise = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export const ProductList = ({ products }: ProductListProps) => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProductCategory | null>(null);

  const counts = useMemo(() => {
    const map = new Map<ProductCategory, number>();
    for (const product of products) {
      map.set(product.category, (map.get(product.category) ?? 0) + 1);
    }
    return map;
  }, [products]);

  const shown = useMemo(() => {
    const term = normalise(query.trim());
    return products.filter((product) => {
      if (category && product.category !== category) return false;
      if (!term) return true;
      return normalise(product.name).includes(term);
    });
  }, [products, query, category]);

  const chip =
    "rounded-pill px-3 py-2 text-xs transition-colors duration-[var(--duration-fast)] ease-entrance";

  return (
    <>
      <div className="flex flex-col gap-3 pb-5">
        <label className="sr-only" htmlFor="admin-search">
          Buscar peça pelo nome
        </label>
        <input
          id="admin-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar pelo nome…"
          className="w-full rounded-control border border-border-subtle bg-surface-raised px-4 py-3 text-sm outline-none focus-visible:border-action-primary"
        />

        <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`${chip} shrink-0 ${
              category === null
                ? "bg-surface-inverse text-foreground-inverse"
                : "bg-surface-muted text-foreground-muted"
            }`}
          >
            Todas {products.length}
          </button>
          {PRODUCT_CATEGORIES.filter((item) => counts.has(item)).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`${chip} shrink-0 ${
                category === item
                  ? "bg-surface-inverse text-foreground-inverse"
                  : "bg-surface-muted text-foreground-muted"
              }`}
            >
              {item} {counts.get(item)}
            </button>
          ))}
        </div>
      </div>

      <p className="pb-2 text-xs text-foreground-muted">
        {shown.length === products.length
          ? `${products.length} peças · ${products.filter((p) => p.active).length} no site`
          : `${shown.length} de ${products.length} peças`}
      </p>

      {shown.length === 0 ? (
        <p className="py-16 text-center text-sm text-foreground-muted">
          Nada encontrado com esse filtro.
        </p>
      ) : (
        <ul>
          {shown.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </ul>
      )}
    </>
  );
};
