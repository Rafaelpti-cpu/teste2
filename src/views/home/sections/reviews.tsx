import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealHeading } from "@/components/ui/reveal-heading";
import type { HomeContent } from "@/data/home";

import { ReviewCard } from "./review-card";

export interface ReviewsProps {
  copy: { eyebrow: string; title: string; linkLabel: string };
  content: HomeContent["reviews"];
  reviewsHref: string;
}

export const Reviews = ({ copy, content, reviewsHref }: ReviewsProps) => (
  <section
    id="avaliacoes"
    aria-labelledby="avaliacoes-title"
    className="container-page scroll-mt-24 py-16 md:py-24"
  >
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="flex flex-col gap-4">
        <Eyebrow>{copy.eyebrow}</Eyebrow>
        <RevealHeading
          id="avaliacoes-title"
          tag="h2"
          className="font-display text-4xl font-light tracking-tight text-foreground md:text-5xl"
        >
          {copy.title}
        </RevealHeading>
      </div>

      <p className="flex items-baseline gap-3">
        <span className="font-display text-4xl font-light text-foreground">
          {content.rating}
        </span>
        <span className="text-sm text-foreground-muted">{content.count}</span>
      </p>
    </div>

    <ul className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3 md:gap-6">
      {content.items.map((review, index) => (
        <ReviewCard key={review.quote} review={review} index={index} />
      ))}
    </ul>

    <a
      href={reviewsHref}
      target="_blank"
      rel="noopener"
      className="mt-8 inline-flex items-center gap-2 text-sm text-foreground-muted underline underline-offset-4 transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
    >
      {copy.linkLabel}
    </a>
  </section>
);
