import { assertAdmin } from "@/lib/admin/auth";
import { ApiError, handle } from "@/lib/api";
import { getCatalogStore } from "@/lib/catalog";
import { productPatchSchema } from "@/lib/catalog/schema";

type Context = { params: Promise<{ id: string }> };

export const GET = handle<Context>(async (_req, { params }) => {
  await assertAdmin();
  const { id } = await params;
  const product = await getCatalogStore().get(id);
  if (!product) {
    throw new ApiError(404, "not_found", "Produto não encontrado.");
  }
  return product;
});

export const PATCH = handle<Context>(async (req, { params }) => {
  await assertAdmin();
  const { id } = await params;
  const patch = productPatchSchema.parse(await req.json());
  return getCatalogStore().update(id, patch);
});

export const DELETE = handle<Context>(async (_req, { params }) => {
  await assertAdmin();
  const { id } = await params;
  await getCatalogStore().remove(id);
  return { removed: true };
});
