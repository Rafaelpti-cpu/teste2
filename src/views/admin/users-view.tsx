import { getCurrentUser, isAdminLocked, requireAdmin } from "@/lib/admin/auth";
import { listUsers, toPublic } from "@/lib/admin/users";
import { getCatalogBackend } from "@/lib/catalog";
import { getStorageUsage } from "@/lib/catalog/storage";

import { AdminShell } from "./admin-shell";
import { UsersForm } from "./users-form";

/** "Acessos" — who can get into the admin. */
export const AdminUsersView = async () => {
  await requireAdmin();
  const [users, current] = await Promise.all([listUsers(), getCurrentUser()]);

  return (
    <AdminShell
      backend={getCatalogBackend()}
      usage={await getStorageUsage()}
      locked={await isAdminLocked()}
      tab="acessos"
      title="Acessos"
    >
      <p className="max-w-[60ch] pb-6 text-sm text-foreground-muted">
        Quem aparece aqui consegue entrar no admin e mexer em produtos e textos.
        As senhas ficam guardadas embaralhadas — se alguém esquecer, o caminho é
        trocar, não recuperar.
      </p>
      <UsersForm
        users={users.map(toPublic)}
        currentId={current?.id ?? null}
      />
    </AdminShell>
  );
};
