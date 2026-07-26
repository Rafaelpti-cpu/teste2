"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { ProductDetails } from "@/components/ui/product-details";
import { ProductGallery } from "@/components/ui/product-gallery";
import { whatsappProductHref } from "@/data/home";
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
        <div
          onClick={(event) => event.stopPropagation()}
          className="max-h-[88lvh] overflow-y-auto p-5 md:p-8"
        >
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
              className="rounded-pill px-3 py-1 text-xl leading-none text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
            >
              ×
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 md:gap-10">
            <ProductGallery images={product.images} name={product.name} />

            <div className="flex flex-col gap-6">
              <ProductDetails product={product} />

              <a
                href={whatsappProductHref(product)}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center justify-center rounded-pill bg-action-primary px-6 py-3.5 text-sm font-medium text-action-primary-foreground transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-action-primary-hover"
              >
                Quero esta peça — falar no WhatsApp
              </a>
              <p className="text-xs text-foreground-muted">
                A mensagem já vai com a foto e o nome da peça, para a gente saber
                exatamente qual é.
              </p>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
};
