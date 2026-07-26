import { notFound } from "next/navigation";

import { isAdminLocked, requireAdmin } from "@/lib/admin/auth";
import { getCatalogBackend, getCatalogStore } from "@/lib/catalog";

import { AdminShell } from "./admin-shell";
import { ProductForm } from "./product-form";

export interface ProductFormViewProps {
  /** Omitted when creating a new product. */
  id?: string;
}

export const ProductFormView = async ({ id }: ProductFormViewProps) => {
  await requireAdmin();
  const product = id ? await getCatalogStore().get(id) : undefined;
  if (id && !product) notFound();

  return (
    <AdminShell
      backend={getCatalogBackend()}
      locked={isAdminLocked()}
      title={product ? "Editar peça" : "Nova peça"}
    >
      <ProductForm product={product ?? undefined} />
    </AdminShell>
  );
};
