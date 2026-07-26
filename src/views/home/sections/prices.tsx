import { ButtonLink } from "@/components/ui/button-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealHeading } from "@/components/ui/reveal-heading";
import { RevealText } from "@/components/ui/reveal-text";
import { PRODUCT_CATEGORIES, type Product } from "@/types/catalog";

import { PriceRow, type PriceRange } from "./price-row";

export interface PricesProps {
  copy: {
    eyebrow: string;
    title: string;
    text?: string;
    note: string;
    ctaLabel: string;
  };
  /** The live catalogue — the ranges are read off it, never typed by hand. */
  products: Product[];
  ctaHref: string;
}

/**
 * What the pieces cost, by section.
 *
 * A shop has no plans to compare, so this is not a tier table: it is the price
 * the catalogue actually starts at for each section, computed from the live
 * products. Nothing here can go stale — change a price in the admin and this
 * changes with it.
 *
 * Editorial by construction: type and hairlines, no cards, no boxes.
 */
export const Prices = ({ copy, products, ctaHref }: PricesProps) => {
  const ranges: PriceRange[] = PRODUCT_CATEGORIES.map((category) => {
    const inCategory = products.filter((item) => item.category === category);
    return {
      category,
      count: inCategory.length,
      from: Math.min(...inCategory.map((item) => item.price)),
      to: Math.max(...inCategory.map((item) => item.price)),
    };
  })
    // An empty section would show "R$ Infinity"; it also has nothing to offer.
    .filter((range) => range.count > 0)
    .sort((a, b) => a.from - b.from);

  if (ranges.length === 0) return null;

  return (
    <section
      id="precos"
      aria-labelledby="precos-title"
      className="container-page scroll-mt-24 py-16 md:py-24"
    >
      <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
        <div className="flex flex-col items-start gap-4 md:sticky md:top-24 md:self-start">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <RevealHeading
            id="precos-title"
            tag="h2"
            className="font-display text-4xl font-light tracking-tight text-foreground md:text-5xl"
          >
            {copy.title}
          </RevealHeading>
          {copy.text && (
            <RevealText
              className="max-w-[40ch] text-base text-foreground-muted"
              delayIn={160}
            >
              {copy.text}
            </RevealText>
          )}
        </div>

        <div className="flex flex-col gap-8">
          <ul className="border-t border-border-subtle">
            {ranges.map((range, index) => (
              <PriceRow key={range.category} range={range} index={index} />
            ))}
          </ul>

          <div className="flex flex-col items-start gap-5">
            <p className="max-w-[42ch] text-sm text-foreground-muted">
              {copy.note}
            </p>
            <ButtonLink href={ctaHref}>{copy.ctaLabel}</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
};
