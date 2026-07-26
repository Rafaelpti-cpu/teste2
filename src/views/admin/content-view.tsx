import { isAdminLocked, requireAdmin } from "@/lib/admin/auth";
import { getCatalogBackend } from "@/lib/catalog";
import { defaultSiteContent, readSiteContent } from "@/lib/content";

import { AdminShell } from "./admin-shell";
import { ContentForm } from "./content-form";

/**
 * "Textos do site" — everything written on the public pages that is not a
 * product. Reads the live document so the form always opens on what is showing.
 */
export const AdminContentView = async () => {
  await requireAdmin();
  const content = await readSiteContent();

  return (
    <AdminShell
      backend={getCatalogBackend()}
      locked={await isAdminLocked()}
      tab="textos"
      title="Textos do site"
    >
      <p className="max-w-[60ch] pb-6 text-sm text-foreground-muted">
        O que você escrever aqui aparece no site assim que salvar. Preços,
        fotos e peças ficam na aba Produtos.
      </p>
      <ContentForm content={content} defaults={defaultSiteContent} />
    </AdminShell>
  );
};
