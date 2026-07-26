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
