"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { ProductDetails } from "@/components/ui/product-details";
import { ProductGallery } from "@/components/ui/product-gallery";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { whatsappProductHref } from "@/data/home";
import { track } from "@/lib/analytics/client";
import { useScroll } from "@/hooks/smooth-scroll/use-scroll";
import type { Product } from "@/types/catalog";

export interface ProductDialogProps {
  product: Product | null;
  onClose: () => void;
}

/**
 * The product, opened from the grid.
 *
 * A dialog rather than a page because most customers are on a phone: tapping a
 * piece should show it, not cost a page load. The same content lives at
 * `/produto/<slug>` for sharing, search engines, and the WhatsApp link preview.
 *
 * Uses the native `<dialog>` element, so the browser gives us the top layer,
 * the backdrop, focus containment and Escape for free.
 */
export const ProductDialog = ({ product, onClose }: ProductDialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const stopScroll = useScroll((state) => state.stop);
  const startScroll = useScroll((state) => state.start);

  /*
    The dialog's open state, and the page's scroll lock, both follow `product`.

    The lock used to be released by the `close` event, and that froze the site.
    Two ways it never arrives:

    1. Leaving the page with a piece open. Tapping "Abrir página da peça"
       navigates, this component unmounts, and removing a `<dialog>` fires
       nothing — so the lock stayed on and the shop could not scroll the
       product page, or the home page after going back. Spec-correct, every
       browser, and exactly the report.
    2. Some engines do not fire it at all. Measured in this project's preview
       browser: `close()` ran with `open === true`, the attribute came off, and
       no `close` event followed — on a bare `<dialog>` built from scratch, so
       it is the engine and not this component.

    Either way `html { overflow: hidden }` was left behind and the page could
    not move in any direction until a reload.

    So the lock is tied to this effect's lifetime instead. The cleanup runs
    when the piece closes AND when this component goes away, which is the case
    an event listener structurally cannot cover. `startScroll` is called from
    here and nowhere else — one owner, no way for the two to disagree.
  */
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (!product) {
      if (dialog.open) dialog.close();
      return;
    }

    if (!dialog.open) {
      dialog.showModal();
      // Most customers browse the grid and never load `/produto/<slug>`, so
      // without this the dialog — the main way a piece is actually looked at —
      // would be invisible in the metrics.
      track("view", `/produto/${product.slug}`, product.slug);
    }

    stopScroll();
    return () => startScroll();
  }, [product, stopScroll, startScroll]);

  /*
    Escape is the one close this component cannot initiate, so it still needs
    the browser to tell us — but `cancel` is what Escape fires, and it fires
    before `close` and in engines where `close` does not. Both are handled;
    `onClose` twice is the same `setState(null)` twice, which costs nothing.

    The × and the backdrop no longer come through here. They set React state
    directly and let the effect above close the dialog, so the one path that
    every customer uses does not depend on an event arriving at all.
  */
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("cancel", handleClose);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("cancel", handleClose);
    };
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-label={product ? product.name : "Detalhes do produto"}
      onClick={(event) => {
        // A click on the dialog itself is a click on the backdrop; the panel
        // inside stops propagation. Clearing the piece is what closes it — the
        // effect above does the `close()`, and the same cleanup releases the
        // scroll lock whether the browser sends us a `close` event or not.
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-[min(56rem,92vw)] rounded-panel bg-background p-0 text-foreground backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {product && (
        /*
          Column, not a single scrolling box: the photo alone is taller than a
          phone, so a CTA placed after it sat below the fold *inside* the
          dialog — the piece looked like it had no way to buy. The content
          scrolls; the button does not move.
        */
        <div
          onClick={(event) => event.stopPropagation()}
          className="flex max-h-[88lvh] flex-col"
        >
          <div className="flex-1 overflow-y-auto p-5 md:p-8">
            <div className="flex items-start justify-between gap-4 pb-4">
              <Link
                href={`/produto/${product.slug}`}
                className="text-xs text-foreground-muted underline underline-offset-4 transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
              >
                Abrir página da peça
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="-m-2 flex size-10 items-center justify-center rounded-pill text-xl leading-none text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
              >
                ×
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 md:gap-10">
              {/*
                88% of the width, on a phone only.

                The thumbnail strip is how a customer learns the piece has more
                photos, and it was landing within 49 px of the scroll edge on a
                375x812 test — which is no margin at all once Safari's address
                bar takes its share, so on a real phone the strip sits at or
                past the fold and nobody scrolls to find it.

                Trimming the width, not the height, is the whole point: the
                frame keeps its 3/4 and shrinks whole, so nothing is cropped.
                Capping the height instead is what used to crop the photo.

                A percentage rather than a `vh` cap because it behaves the same
                on every phone — a viewport-height cap bites hard on a wide
                screen and not at all on a narrow one. This buys ~50 px
                everywhere, which is the margin that was missing.
              */}
              <ProductGallery
                images={product.images}
                name={product.name}
                className="mx-auto w-full max-w-[88%] md:max-w-none"
              />
              <ProductDetails product={product} />
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-border-subtle bg-background p-4 md:px-8 md:pb-8">
            <WhatsAppButton
              href={whatsappProductHref(product)}
              productSlug={product.slug}
            >
              Quero esta peça
            </WhatsAppButton>
            <p className="text-center text-xs text-foreground-muted">
              A mensagem já vai com a foto e o nome da peça.
            </p>
          </div>
        </div>
      )}
    </dialog>
  );
};
