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

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (product && !dialog.open) {
      dialog.showModal();
      // Most customers browse the grid and never load `/produto/<slug>`, so
      // without this the dialog — the main way a piece is actually looked at —
      // would be invisible in the metrics.
      track("view", `/produto/${product.slug}`, product.slug);
      // Lock the page behind it through Lenis, not `body { overflow }` —
      // the smooth-scroll layer owns scrolling here.
      stopScroll();
    }
    if (!product && dialog.open) {
      dialog.close();
      startScroll();
    }
  }, [product, stopScroll, startScroll]);

  // Escape and the backdrop close it natively; keep React's state in step.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const handleClose = () => {
      startScroll();
      onClose();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose, startScroll]);

  return (
    <dialog
      ref={ref}
      aria-label={product ? product.name : "Detalhes do produto"}
      onClick={(event) => {
        // A click on the dialog itself is a click on the backdrop; the panel
        // inside stops propagation.
        if (event.target === ref.current) ref.current?.close();
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
                onClick={() => ref.current?.close()}
                aria-label="Fechar"
                className="-m-2 flex size-10 items-center justify-center rounded-pill text-xl leading-none text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
              >
                ×
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 md:gap-10">
              <ProductGallery images={product.images} name={product.name} />
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
