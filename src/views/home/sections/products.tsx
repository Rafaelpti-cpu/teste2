"use client";

import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealHeading } from "@/components/ui/reveal-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { PRODUCT_CATEGORIES, type Product, type ProductCategory } from "@/types/catalog";

import { useState } from "react";

import { useCatalogFilter } from "./catalog-filter";
import { ProductCard } from "./product-card";
import { ProductDialog } from "./product-dialog";

export interface ProductsProps {
  copy: { eyebrow: string; title: string; ctaLabel: string };
  products: Product[];
  /** Where "ver tudo" sends people — the shop's WhatsApp. */
  allHref: string;
}

/**
 * The catalogue, filtered by category.
 *
 * A client component because the filter is the point: 40 pieces in one flat
 * grid is what the shop asked us to avoid. Categories with nothing in them are
 * not offered — an empty tab is a dead end.
 */
export const Products = ({ copy, products, allHref }: ProductsProps) => {
  // Shared with the category cards above, which jump straight to a filter.
  const active = useCatalogFilter((state) => state.category);
  const setActive = useCatalogFilter((state) => state.setCategory);
  // Which piece is open. Local, because the grid is the only thing that opens it.
  const [opened, setOpened] = useState<Product | null>(null);

  const counts = new Map<ProductCategory, number>();
  for (const product of products) {
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  }

  const available = PRODUCT_CATEGORIES.filter((category) => counts.has(category));
  const shown = active
    ? products.filter((product) => product.category === active)
    : products;

  const tab =
    "rounded-pill px-4 py-2 text-sm transition-colors duration-[var(--duration-fast)] ease-entrance";

  return (
    <section
      id="novidades"
      aria-labelledby="novidades-title"
      className="container-page scroll-mt-24 py-16 md:py-24"
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <RevealHeading
            id="novidades-title"
            tag="h2"
            className="font-display text-4xl font-light tracking-tight text-foreground md:text-5xl"
          >
            {copy.title}
          </RevealHeading>
        </div>

        <ButtonLink href={allHref} variant="outline">
          {copy.ctaLabel}
        </ButtonLink>
      </div>

      <div
        role="tablist"
        aria-label="Filtrar por categoria"
        className="mt-8 flex flex-wrap items-center gap-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={active === null}
          onClick={() => setActive(null)}
          className={`${tab} ${
            active === null
              ? "bg-surface-inverse text-foreground-inverse"
              : "bg-surface-muted text-foreground-muted hover:text-foreground"
          }`}
        >
          Todas
          <span className="ml-2 text-xs opacity-70">{products.length}</span>
        </button>

        {available.map((category) => (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={active === category}
            onClick={() => setActive(category)}
            className={`${tab} ${
              active === category
                ? "bg-surface-inverse text-foreground-inverse"
                : "bg-surface-muted text-foreground-muted hover:text-foreground"
            }`}
          >
            {category}
            <span className="ml-2 text-xs opacity-70">{counts.get(category)}</span>
          </button>
        ))}
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:mt-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
        {shown.map((product, index) => (
          <ProductCard
            // Keyed by filter too, so switching category replays the reveal
            // instead of leaving recycled cards at their finished state.
            key={`${active ?? "todas"}-${product.id}`}
            product={product}
            onOpen={setOpened}
            index={index}
          />
        ))}
      </ul>

      <ProductDialog product={opened} onClose={() => setOpened(null)} />
    </section>
  );
};
