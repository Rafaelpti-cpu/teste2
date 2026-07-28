import { assertAdmin } from "@/lib/admin/auth";
import { ApiError, handle } from "@/lib/api";
import { getCatalogStore } from "@/lib/catalog";
import { deleteStorageObjects, getStorageReport } from "@/lib/catalog/storage";

/**
 * `DELETE /api/admin/espaco` — removes photos no piece points at.
 *
 * The orphan set is recomputed **here**, from the catalogue as it is at this
 * instant, rather than trusting a list the browser was shown a minute ago. A
 * photo added between the page render and the button press would otherwise be
 * deleted for having been invisible at the wrong moment.
 *
 * 📖 Docs: obsidian/backend/catalog-store.md
 */
export const DELETE = handle(async () => {
  await assertAdmin();

  const products = await getCatalogStore().list();
  const report = await getStorageReport(products);

  if (!report) {
    throw new ApiError(
      503,
      "storage_unavailable",
      "Não foi possível ler o espaço agora. Tente de novo em instantes.",
    );
  }

  const removed = await deleteStorageObjects(
    report.orphans.map((file) => file.name),
  );

  return { removed, freedBytes: report.orphanBytes };
});
