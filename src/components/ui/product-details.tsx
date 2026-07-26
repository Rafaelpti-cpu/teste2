// 📖 Docs: obsidian/frontend/components/ui.md
import type { Product } from "@/types/catalog";
import { formatInstalments, formatPrice } from "@/utils/format";

export interface ProductDetailsProps {
  product: Product;
  /** Heading level — `h2` inside the dialog, `h1` on the product page. */
  tag?: "h1" | "h2";
}

/**
 * The written half of a product: name, price, grade, colourways, description.
 *
 * Shared by the dialog and the product page so the two can never say different
 * things about the same piece. A Server Component — it holds no state.
 */
export const ProductDetails = ({ product, tag = "h2" }: ProductDetailsProps) => {
  const Heading = tag;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-xs tracking-[0.18em] text-foreground-muted uppercase">
          {product.category}
        </span>
        <Heading className="font-display text-2xl font-light text-foreground md:text-3xl">
          {product.name}
        </Heading>
      </div>

      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-3xl font-light text-foreground">
          {formatPrice(product.price)}
        </span>
        <span className="text-sm text-foreground-muted">
          ou {formatInstalments(product.price)} sem juros
        </span>
      </p>

      {product.description && (
        <p className="text-base whitespace-pre-line text-foreground-muted">
          {product.description}
        </p>
      )}

      {product.sizes.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs tracking-[0.18em] text-foreground-muted uppercase">
            Tamanhos disponíveis
          </h3>
          <ul className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <li
                key={size}
                className="rounded-control border border-border-subtle px-3 py-1.5 text-sm text-foreground"
              >
                {size}
              </li>
            ))}
          </ul>
        </div>
      )}

      {product.colors.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs tracking-[0.18em] text-foreground-muted uppercase">
            Cores disponíveis
          </h3>
          <ul className="flex flex-wrap gap-3">
            {product.colors.map((color) => (
              <li
                key={`${color.name}-${color.hex}`}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: color.hex }}
                  className="size-4 rounded-pill border border-border-subtle"
                />
                {color.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
