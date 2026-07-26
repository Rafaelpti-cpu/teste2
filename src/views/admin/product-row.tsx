"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteProduct, updateProduct } from "@/lib/admin/client";
import { coverImage, type Product } from "@/types/catalog";
import { formatPrice } from "@/utils/format";

export interface ProductRowProps {
  product: Product;
}

/**
 * One product in the admin list.
 *
 * Laid out for a phone first: the actions wrap onto their own line below the
 * name instead of being squeezed into a row, and every control is a full tap
 * target rather than a word.
 */
export const ProductRow = ({ product }: ProductRowProps) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const run = async (task: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await task();
      router.refresh();
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  // ~44px tall — the floor for a comfortable thumb target on a phone.
  const action =
    "rounded-control px-3.5 py-3 text-sm transition-colors duration-[var(--duration-fast)] ease-entrance disabled:opacity-50";

  return (
    <li className="flex flex-col gap-3 border-b border-border-subtle py-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Link
          href={`/admin/produtos/${product.id}`}
          className="relative size-16 shrink-0 overflow-hidden rounded-control bg-surface-muted"
          aria-label={`Editar ${product.name}`}
        >
          <Image
            src={coverImage(product)}
            alt=""
            fill
            sizes="4rem"
            className="object-cover"
          />
          {product.images.length > 1 && (
            <span className="absolute right-0.5 bottom-0.5 rounded-pill bg-background/85 px-1.5 text-[0.625rem] text-foreground-muted">
              {product.images.length}
            </span>
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-sm text-foreground">{product.name}</span>
          <span className="text-xs text-foreground-muted">
            {product.category} · {formatPrice(product.price)}
          </span>
          {product.sizes.length > 0 && (
            <span className="truncate text-xs text-foreground-muted">
              {product.sizes.join(", ")}
            </span>
          )}
          {product.colors.length > 0 && (
            <ul className="flex items-center gap-1.5" aria-label="Cores">
              {product.colors.map((color) => (
                <li
                  key={`${color.name}-${color.hex}`}
                  title={color.name}
                  style={{ backgroundColor: color.hex }}
                  className="size-3 rounded-pill border border-border-subtle"
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run(() => updateProduct(product.id, { active: !product.active }))
          }
          className={`${action} ${
            product.active
              ? "bg-surface-accent text-foreground-accent"
              : "bg-surface-muted text-foreground-muted"
          }`}
        >
          {product.active ? "No site" : "Oculta"}
        </button>

        <Link
          href={`/admin/produtos/${product.id}`}
          className={`${action} text-foreground-muted hover:text-foreground`}
        >
          Editar
        </Link>

        {confirming ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => deleteProduct(product.id))}
              className={`${action} bg-action-primary text-action-primary-foreground`}
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className={`${action} text-foreground-muted`}
            >
              Não
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={`${action} text-foreground-muted hover:text-foreground-accent`}
          >
            Excluir
          </button>
        )}
      </div>
    </li>
  );
};
