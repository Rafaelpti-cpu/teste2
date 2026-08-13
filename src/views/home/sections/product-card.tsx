"use client";

import Image from "next/image";
import Link from "next/link";

import { Hover } from "@/components/animation/springs/hover";
import { coverImage, hoverImage, type Product } from "@/types/catalog";
import { formatInstalments, formatPrice } from "@/utils/format";

export interface ProductCardProps {
  product: Product;
  /** Opens the detail dialog. */
  onOpen: (product: Product) => void;
  /** Position in the grid — drives the reveal stagger within each row. */
  index: number;
}

/**
 * Above this position a photo is fetched eagerly instead of lazily.
 *
 * Four covers the first row on a phone and most of the first on a desktop —
 * the pieces someone sees before scrolling, which should not wait for the
 * lazy-loading pass.
 */
const EAGER_BEFORE = 4;

export const ProductCard = ({ product, onOpen, index }: ProductCardProps) => {
  const cover = coverImage(product);
  const second = hoverImage(product);

  return (
    /*
      A plain `<li>`, not an `<Inview>`.

      Every reveal in this project renders its "from" state on the server, so a
      card wrapped in one arrives as `opacity: 0` and stays invisible until
      ~950 KB of JavaScript has downloaded, hydrated and fired an
      IntersectionObserver. On a phone over mobile data that is seconds of a
      catalogue that appears empty — the shop's report was "only two pieces
      load, then the rest take a while", which is exactly that sequence being
      watched in real time.

      `enabled={false}` does not help: the component holds at `from` when it is
      not active, so disabling the animation leaves the card invisible forever.
      The springs are `#do-not-modify`, and rightly — the fix is not to change
      how reveals work, it is to stop putting the shop's inventory behind one.

      Headings and decorative blocks keep their reveals. A heading that fades in
      late is a flourish; a product that does is a lost sale.
    */
    <li>
      <article className="flex h-full flex-col">
        {/*
          A real link that behaves like a button.

          It was a `<button>`, because tapping should open the dialog rather
          than cost a page load — most customers are on a phone. The cost was
          invisible and total: with no `<a>` anywhere on the site, nothing could
          reach `/produto/<slug>`. Search engines had no path to a single
          product page, and a customer could not open a piece in a new tab,
          copy its address, or send it to a friend.

          So: an anchor with the real address, whose click is intercepted. The
          dialog still opens on a plain tap. A modified click — ctrl, cmd,
          middle button, "open in new tab" — is left alone and navigates, which
          is exactly what the person asked for.
        */}
        <Link
          href={`/produto/${product.slug}`}
          /*
            No prefetch. `<Link>` fetches every destination that scrolls into
            view, and here that is eight product pages the click will not use —
            eight server renders, eight catalogue reads and eight payloads to
            parse, to prepare a navigation that only happens on a middle click.
            The address is here for crawlers and for "open in new tab"; the
            plain tap opens the dialog and never leaves the page.
          */
          prefetch={false}
          onClick={(event) => {
            if (
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey ||
              event.button !== 0
            ) {
              return;
            }
            event.preventDefault();
            onOpen(product);
          }}
          className="group flex h-full w-full flex-col gap-4 text-left"
          aria-label={`Ver ${product.name}`}
        >
          <Hover
            tag="div"
            from={{ scale: 1 }}
            to={{ scale: 1.05 }}
            config={{ tension: 170, friction: 24 }}
            className="relative aspect-[3/4] w-full overflow-hidden rounded-card bg-surface-muted"
          >
            <Image
              src={cover}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 18rem"
              className="object-cover"
              // The first row is what a customer sees before scrolling; leaving
              // it to the lazy pass is why the grid appeared to fill in slowly.
              priority={index < EAGER_BEFORE}
            />
            {/* The shop's own alternate angle. A cross-fade is opacity only,
                which is the one case CSS owns (ADR-0014) — no spring needed. */}
            {second && (
              <Image
                src={second}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 18rem"
                className="object-cover opacity-0 transition-opacity duration-[var(--duration-normal)] ease-entrance group-hover:opacity-100"
              />
            )}
            {product.images.length > 1 && (
              <span className="absolute right-2 bottom-2 rounded-pill bg-background/85 px-2 py-0.5 text-[0.625rem] text-foreground-muted backdrop-blur-sm">
                {product.images.length} fotos
              </span>
            )}
          </Hover>

          <div className="flex flex-col gap-1">
            <span className="text-xs tracking-[0.18em] text-foreground-muted uppercase">
              {product.category}
            </span>
            <h3 className="text-base text-foreground">{product.name}</h3>
            <p className="font-display text-lg text-foreground">
              {formatPrice(product.price)}
              <span className="ml-2 text-xs font-normal text-foreground-muted">
                ou {formatInstalments(product.price)}
              </span>
            </p>

            {product.sizes.length > 0 && (
              <p className="text-xs text-foreground-muted">
                Tam. {product.sizes.join(" · ")}
              </p>
            )}

            {product.colors.length > 0 && (
              <ul
                className="mt-1 flex items-center gap-1.5"
                aria-label="Cores disponíveis"
              >
                {product.colors.map((color) => (
                  <li
                    key={`${color.name}-${color.hex}`}
                    title={color.name}
                    style={{ backgroundColor: color.hex }}
                    className="size-3 rounded-pill border border-border-subtle"
                  >
                    <span className="sr-only">{color.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Link>
      </article>
    </li>
  );
};
