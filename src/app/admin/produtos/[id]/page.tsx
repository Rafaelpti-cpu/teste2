import { ProductFormView } from "@/views/admin/product-form-view";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductFormView id={id} />;
}
