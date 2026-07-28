import Link from "next/link";

import type { CatalogBackend } from "@/lib/catalog/store";
import type { StorageUsage } from "@/lib/catalog/storage";

import { StorageMeter } from "./storage-meter";

export type AdminTab = "produtos" | "textos" | "medicoes" | "espaco" | "acessos";

export interface AdminShellProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  backend: CatalogBackend;
  /** Whether any access exists — the area is open until the first one. */
  locked: boolean;
  /** Which nav entry is current. Omit on pages that are not a tab (the form). */
  tab?: AdminTab;
  /** Photo storage usage. `null` on the file backing, where there is no quota. */
  usage?: StorageUsage | null;
}

const BACKEND_LABEL: Record<CatalogBackend, string> = {
  file: "Salvando em arquivo local (.data/)",
  supabase: "Salvando no Supabase",
};

const TABS: { id: AdminTab; label: string; href: string }[] = [
  { id: "produtos", label: "Produtos", href: "/admin" },
  { id: "textos", label: "Textos do site", href: "/admin/textos" },
  { id: "medicoes", label: "Medições", href: "/admin/medicoes" },
  { id: "espaco", label: "Espaço", href: "/admin/espaco" },
  { id: "acessos", label: "Acessos", href: "/admin/acessos" },
];

/** Chrome shared by every admin page: header, tabs, warnings, page title. */
export const AdminShell = ({
  title,
  children,
  action,
  backend,
  locked,
  tab,
  usage = null,
}: AdminShellProps) => (
  <div className="min-h-lvh bg-background">
    <header className="border-b border-border-subtle">
      <div className="container-page flex items-center justify-between gap-4 py-4">
        <Link href="/admin" className="font-display text-sm tracking-[0.3em]">
          RENOVA · ADMIN
        </Link>
        <Link
          href="/"
          className="text-sm text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
        >
          Ver o site
        </Link>
      </div>

      <nav aria-label="Áreas do admin" className="container-page">
        <ul className="scrollbar-none -mb-px flex gap-1 overflow-x-auto">
          {TABS.map((entry) => (
            <li key={entry.id}>
              <Link
                href={entry.href}
                aria-current={tab === entry.id ? "page" : undefined}
                className={`inline-block border-b-2 px-4 py-3 text-sm whitespace-nowrap transition-colors duration-[var(--duration-fast)] ease-entrance ${
                  tab === entry.id
                    ? "border-action-primary text-foreground"
                    : "border-transparent text-foreground-muted hover:text-foreground"
                }`}
              >
                {entry.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>

    <main className="container-page py-10">
      {!locked && (
        <p
          role="status"
          className="mb-6 rounded-card border border-decor-accent bg-surface-accent px-4 py-3 text-sm text-foreground"
        >
          <strong className="font-medium">Esta área está sem senha.</strong>{" "}
          Antes de publicar o site, crie o primeiro acesso definindo{" "}
          <code>ADMIN_EMAIL</code> e <code>ADMIN_PASSWORD</code> no ambiente —
          qualquer pessoa com o endereço consegue editar e excluir produtos.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-light text-foreground">
            {title}
          </h1>
          <p className="text-xs text-foreground-muted">{BACKEND_LABEL[backend]}</p>
        </div>
        {action}
      </div>

      {/*
        In the chrome, not on a settings page: a gauge you have to go looking
        for is one you read for the first time on the day it runs out.
      */}
      {usage && (
        <div className="pb-8">
          <StorageMeter usage={usage} />
        </div>
      )}

      {children}
    </main>
  </div>
);
