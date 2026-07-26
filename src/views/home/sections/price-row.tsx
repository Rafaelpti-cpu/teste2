"use client";

import { Inview } from "@/components/animation/springs/in-view";
import type { ProductCategory } from "@/types/catalog";
import { formatPrice } from "@/utils/format";
import { scrollTo } from "@/utils/scroll-to";

import { useCatalogFilter } from "./catalog-filter";

export interface PriceRange {
  category: ProductCategory;
  from: number;
  to: number;
  count: number;
}

export interface PriceRowProps {
  range: PriceRange;
  index: number;
}

/**
 * One line of the price list.
 *
 * A button, like the category cards: reading a price and wanting to see the
 * pieces is the same gesture, so the row filters the grid instead of being
 * decoration.
 */
export const PriceRow = ({ range, index }: PriceRowProps) => {
  const setCategory = useCatalogFilter((state) => state.setCategory);

  return (
    <Inview
      tag="li"
      mode="once"
      from={{ opacity: 0, y: 26 }}
      to={{ opacity: 1, y: 0 }}
      config={{ tension: 120, friction: 26 }}
      delayIn={index * 80}
    >
      <button
        type="button"
        onClick={() => {
          setCategory(range.category);
          scrollTo("novidades");
        }}
        className="group grid w-full grid-cols-[1fr_auto] items-baseline gap-6 border-b border-border-subtle py-6 text-left md:py-8"
      >
        <span className="flex flex-col gap-1">
          <span className="font-display text-2xl font-light text-foreground md:text-3xl">
            {range.category}
          </span>
          <span className="text-xs tracking-[0.18em] text-foreground-muted uppercase">
            {range.count} peça{range.count === 1 ? "" : "s"}
            {range.to > range.from && ` · até ${formatPrice(range.to)}`}
          </span>
        </span>

        <span className="flex items-baseline gap-3">
          <span className="hidden text-xs tracking-[0.18em] text-foreground-muted uppercase sm:inline">
            a partir de
          </span>
          <span className="font-display text-2xl font-light text-foreground transition-colors duration-[var(--duration-fast)] ease-entrance group-hover:text-foreground-accent md:text-4xl">
            {formatPrice(range.from)}
          </span>
          <span
            aria-hidden="true"
            className="text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance group-hover:text-foreground-accent"
          >
            →
          </span>
        </span>
      </button>
    </Inview>
  );
};
