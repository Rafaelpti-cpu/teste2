import { notFound } from "next/navigation";

import { isAdminLocked, requireAdmin } from "@/lib/admin/auth";
import { getCatalogBackend, getCatalogStore } from "@/lib/catalog";
import { getStorageUsage } from "@/lib/catalog/storage";
import { categoriesOf, DEFAULT_CATEGORIES } from "@/types/catalog";

import { AdminShell } from "./admin-shell";
import { ProductForm } from "./product-form";

export interface ProductFormViewProps {
  /** Omitted when creating a new product. */
  id?: string;
}

export const ProductFormView = async ({ id }: ProductFormViewProps) => {
  await requireAdmin();
  const store = getCatalogStore();
  const [product, all] = await Promise.all([
    id ? store.get(id) : Promise.resolve(undefined),
    store.list(),
  ]);
  if (id && !product) notFound();

  // Derived from the catalogue, so a section the shop invented on the last
  // piece is already on the list for the next one.
  const categories = categoriesOf(all);

  return (
    <AdminShell
      backend={getCatalogBackend()}
      usage={await getStorageUsage()}
      locked={await isAdminLocked()}
      title={product ? "Editar peça" : "Nova peça"}
    >
      <ProductForm
        product={product ?? undefined}
        categories={categories.length > 0 ? categories : [...DEFAULT_CATEGORIES]}
      />
    </AdminShell>
  );
};
