// 📖 Docs: obsidian/frontend/components/ui.md
"use client";

import Image from "next/image";
import { useState } from "react";

export interface ProductGalleryProps {
  images: string[];
  /** Product name — the alt text describes the piece, not "photo 2". */
  name: string;
  className?: string;
  /** The first photo of the first product on screen is the LCP candidate. */
  priority?: boolean;
}

/**
 * Photo gallery for a product.
 *
 * One big frame plus a thumbnail strip. The strip is a horizontal scroller so
 * it degrades into a natural swipe on a phone — no carousel library, no drag
 * handlers, and it keeps working with a keyboard.
 */
export const ProductGallery = ({
  images,
  name,
  className = "",
  priority = false,
}: ProductGalleryProps) => {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/*
        Aspect ratio only — no height cap.

        There used to be a `max-h-[46lvh]` here, meant to keep the price near
        the photo on a phone. It could not: with `w-full` the width does not
        follow, so the frame stopped being 3/4 and `object-cover` ate the
        difference. Measured on a 375×812 phone: the frame came out 294×373
        (0.787) against a 900×1200 photo (0.75), cutting 4.7% of the height —
        top and bottom, which is the head and the hem of the piece. On a
        stubbier phone (360×640) the same rule cut about a quarter of it.

        The card in the grid is a plain `aspect-[3/4]`, so the photo the
        customer taps is whole and the one that opens was not — the shop
        reported exactly that. This frame is now the same shape as that card,
        which is the same shape as the photo, so nothing is cropped anywhere.

        The cap was not buying what it was for, either: with it in place the
        name sat at y=636 in a box ending at y=650 and the price below that —
        already past the fold. Removing it costs ~19 px more scrolling. The
        WhatsApp button is pinned in the dialog's footer and never moved.
      */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-card bg-surface-muted">
        {current && (
          <Image
            key={current}
            src={current}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, 32rem"
            className="object-cover"
            priority={priority}
          />
        )}
      </div>

      {images.length > 1 && (
        <ul className="scrollbar-none flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <li key={image} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Ver foto ${index + 1} de ${images.length}`}
                aria-current={index === active}
                className={`relative block aspect-[3/4] w-16 overflow-hidden rounded-control border transition-colors duration-[var(--duration-fast)] ease-entrance ${
                  index === active
                    ? "border-action-primary"
                    : "border-border-subtle hover:border-border-strong"
                }`}
              >
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="4rem"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
