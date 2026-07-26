"use client";

import Image from "next/image";

import { Hover } from "@/components/animation/springs/hover";
import { Inview } from "@/components/animation/springs/in-view";
import type { Category } from "@/data/home";
import type { ProductCategory } from "@/types/catalog";
import { scrollTo } from "@/utils/scroll-to";

import { useCatalogFilter } from "./catalog-filter";

export interface CategoryCardProps {
  category: Category;
  /** The catalogue category this card selects. */
  target: ProductCategory;
  /** How many pieces are in it — a card promising nothing is worse than none. */
  count: number;
  /** Position in the grid — drives the reveal stagger. */
  index: number;
}

/**
 * Picks a category and takes the reader to the grid.
 *
 * A `<button>`, not a link: it changes what is shown on this page rather than
 * going anywhere. The scroll goes through the Lenis helper so it matches every
 * other in-page jump.
 */
export const CategoryCard = ({
  category,
  target,
  count,
  index,
}: CategoryCardProps) => {
  const setCategory = useCatalogFilter((state) => state.setCategory);

  return (
    <Inview
      tag="li"
      mode="once"
      from={{ opacity: 0, y: 40 }}
      to={{ opacity: 1, y: 0 }}
      config={{ tension: 120, friction: 26 }}
      delayIn={index * 90}
    >
      <button
        type="button"
        onClick={() => {
          setCategory(target);
          scrollTo("novidades");
        }}
        className="group block w-full overflow-hidden rounded-card bg-surface-muted text-left"
      >
        <Hover
          tag="div"
          from={{ scale: 1 }}
          to={{ scale: 1.06 }}
          config={{ tension: 180, friction: 24 }}
          className="relative aspect-[3/4] overflow-hidden"
        >
          <Image
            src={category.image}
            alt={`Seção ${category.name} da Renova Closet`}
            fill
            sizes="(max-width: 768px) 50vw, 20rem"
            className="object-cover"
          />
        </Hover>

        <span className="flex items-center justify-between gap-3 px-5 py-4">
          <span className="flex flex-col gap-0.5">
            <span className="font-display text-lg tracking-wide text-foreground">
              {category.name}
            </span>
            <span className="text-xs text-foreground-muted">
              {count} peça{count === 1 ? "" : "s"} · {category.tagline}
            </span>
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
