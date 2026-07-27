import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealHeading } from "@/components/ui/reveal-heading";
import { RevealText } from "@/components/ui/reveal-text";
import type { Category, SectionCopy } from "@/data/home";
import type { Product, ProductCategory } from "@/types/catalog";

import { CategoryCard } from "./category-card";

export interface CategoriesProps {
  copy: SectionCopy;
  categories: Category[];
  /** The live catalogue — only categories that actually hold pieces are shown. */
  products: Product[];
}

/** The section's slug matches the catalogue category by name. */
const toCategory = (name: string) => name as ProductCategory;

export const Categories = ({ copy, categories, products }: CategoriesProps) => {
  const counts = new Map<string, number>();
  for (const product of products) {
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  }

  const shown = categories.filter((category) => counts.has(category.name));
  if (shown.length === 0) return null;

  return (
    <section
      id="categorias"
      aria-labelledby="categorias-title"
      className="container-page scroll-mt-24 py-10 md:py-24"
    >
      <div className="flex flex-col gap-4 md:max-w-[52ch]">
        <Eyebrow>{copy.eyebrow}</Eyebrow>
        <RevealHeading
          id="categorias-title"
          tag="h2"
          className="font-display text-4xl font-light tracking-tight text-foreground md:text-5xl"
        >
          {copy.title}
        </RevealHeading>
        <RevealText className="text-base text-foreground-muted" delayIn={160}>
          {copy.text}
        </RevealText>
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-4 md:mt-14 md:grid-cols-4 md:gap-6">
        {shown.map((category, index) => (
          <CategoryCard
            key={category.slug}
            category={category}
            target={toCategory(category.name)}
            count={counts.get(category.name) ?? 0}
            index={index}
          />
        ))}
      </ul>
    </section>
  );
};
