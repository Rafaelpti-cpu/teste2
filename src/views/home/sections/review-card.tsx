"use client";

import { Inview } from "@/components/animation/springs/in-view";
import type { Review } from "@/data/home";

export interface ReviewCardProps {
  review: Review;
  /** Position in the row — drives the reveal stagger. */
  index: number;
}

export const ReviewCard = ({ review, index }: ReviewCardProps) => (
  <Inview
    tag="li"
    mode="once"
    from={{ opacity: 0, y: 36 }}
    to={{ opacity: 1, y: 0 }}
    config={{ tension: 120, friction: 26 }}
    delayIn={index * 110}
    className="w-[82%] shrink-0 snap-start md:w-auto"
  >
    <figure className="flex h-full flex-col justify-between gap-6 rounded-card border border-border-subtle bg-surface-raised p-6 md:p-8">
      <blockquote className="text-base text-foreground">
        <p>“{review.quote}”</p>
      </blockquote>
      <figcaption className="flex items-center gap-3 text-sm text-foreground-muted">
        <span
          aria-hidden="true"
          className="size-8 rounded-pill bg-surface-accent"
        />
        {review.author}
      </figcaption>
    </figure>
  </Inview>
);
