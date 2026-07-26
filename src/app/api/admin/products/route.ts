import { assertAdmin } from "@/lib/admin/auth";
import { handle } from "@/lib/api";
import { getCatalogStore } from "@/lib/catalog";
import { productInputSchema } from "@/lib/catalog/schema";

/** Every product, newest first — inactive ones included (this is the admin). */
export const GET = handle(async () => {
  await assertAdmin();
  return getCatalogStore().list();
});

export const POST = handle(async (req) => {
  await assertAdmin();
  const input = productInputSchema.parse(await req.json());
  return getCatalogStore().create(input);
});
