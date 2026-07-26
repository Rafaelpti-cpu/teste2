import Link from "next/link";

import { getCatalogBackend, getCatalogStore } from "@/lib/catalog";
import { isAdminLocked, requireAdmin } from "@/lib/admin/auth";

import { AdminShell } from "./admin-shell";
import { ProductList } from "./product-list";

/**
 * Admin home — the catalogue as a working list.
 *
 * A Server Component: it reads the store directly, so the page always shows
 * what is actually saved. The rows are client leaves because they mutate.
 */
export const AdminProductsView = async () => {
  await requireAdmin();
  const products = await getCatalogStore().list();
  const backend = getCatalogBackend();

  return (
    <AdminShell
      backend={backend}
      locked={isAdminLocked()}
      tab="produtos"
      title="Produtos"
      action={
        <Link
          href="/admin/produtos/novo"
          className="rounded-pill bg-action-primary px-5 py-2.5 text-sm font-medium text-action-primary-foreground transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-action-primary-hover"
        >
          Adicionar peça
        </Link>
      }
    >
      {products.length === 0 ? (
        <p className="py-16 text-center text-sm text-foreground-muted">
          Nenhuma peça cadastrada ainda.
        </p>
      ) : (
        <ProductList products={products} />
      )}
    </AdminShell>
  );
};
