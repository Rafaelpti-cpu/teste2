import Link from "next/link";

import { isAdminLocked, requireAdmin } from "@/lib/admin/auth";
import { getCatalogBackend, getCatalogStore } from "@/lib/catalog";
import { getStorageReport, type StorageReport } from "@/lib/catalog/storage";

import { AdminShell } from "./admin-shell";
import { StorageCleanup } from "./storage-cleanup";
import { StorageMeter } from "./storage-meter";

const formatSize = (bytes: number) => {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(2).replace(".", ",")} GB`;
  if (mb >= 1) return `${mb.toFixed(mb < 10 ? 1 : 0).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

/** "Espaço" — how much room the photos take, and how to get some back. */
export const AdminStorageView = async () => {
  await requireAdmin();

  const products = await getCatalogStore().list();
  const backend = getCatalogBackend();
  const [result, locked] = await Promise.all([
    getStorageReport(products),
    isAdminLocked(),
  ]);

  return (
    <AdminShell
      backend={backend}
      // From the report's own listing, not the cache — see getStorageReport.
      usage={result.status === "ok" ? result.report.usage : null}
      locked={locked}
      tab="espaco"
      title="Espaço"
    >
      {result.status === "ok" ? (
        <Report report={result.report} />
      ) : result.status === "error" ? (
        /*
          Supabase is configured but the bucket could not be read. This branch
          used to print "the photos are on disk", which was false and was
          contradicted by the backend label three lines above it.
        */
        <div className="flex max-w-[60ch] flex-col gap-4 text-sm text-foreground-muted">
          <p className="text-foreground">
            Não consegui ler o espaço das fotos.
          </p>
          <p>
            O site continua funcionando e as peças que já existem não são
            afetadas. Mas a mesma pasta recebe os envios, então{" "}
            <strong className="font-medium text-foreground">
              adicionar fotos novas provavelmente também vai falhar
            </strong>{" "}
            — vale testar antes de contar com isso.
          </p>
          <p>
            O que o banco respondeu, para eu poder consertar:
          </p>
          <pre className="overflow-x-auto rounded-card bg-surface-muted p-3 text-xs text-foreground">
            {result.detail}
          </pre>
        </div>
      ) : (
        <p className="max-w-[60ch] text-sm text-foreground-muted">
          O espaço só é medido quando as fotos ficam no Supabase. Nesta
          instalação elas estão em disco, e o tamanho é uma questão do servidor.
        </p>
      )}
    </AdminShell>
  );
};

const Report = ({
  report,
}: {
  report: StorageReport;
}) => {
  const { usage, products, orphans, orphanBytes } = report;
  const freeBytes = Math.max(0, usage.limitBytes - usage.usedBytes);
  const averageBytes =
    usage.files > 0 ? usage.usedBytes / usage.files : 0;
  const photosLeft =
    averageBytes > 0 ? Math.floor(freeBytes / averageBytes) : null;

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-5">
        <StorageMeter usage={usage} />
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3">
          <Figure
            value={formatSize(freeBytes)}
            label="Livre"
            hint="Quanto ainda cabe."
          />
          <Figure
            value={photosLeft === null ? "—" : `~${photosLeft}`}
            label="Fotos que ainda cabem"
            hint={
              averageBytes > 0
                ? `Pela média atual, ${formatSize(averageBytes)} por foto.`
                : "Sem fotos para calcular a média."
            }
          />
          <Figure
            value={formatSize(orphanBytes)}
            label="Em fotos soltas"
            hint="Espaço que dá para recuperar agora."
            strong={orphanBytes > 0}
          />
        </dl>
      </section>

      <section aria-labelledby="soltas" className="flex flex-col gap-4">
        <h2 id="soltas" className="font-display text-2xl font-light">
          Fotos soltas
        </h2>
        {orphans.length === 0 ? (
          <p className="max-w-[60ch] text-sm text-foreground-muted">
            Nenhuma. Todas as fotos guardadas estão sendo usadas por alguma
            peça.
          </p>
        ) : (
          <>
            <p className="max-w-[60ch] text-sm text-foreground-muted">
              São {orphans.length}{" "}
              {orphans.length === 1 ? "foto que não está" : "fotos que não estão"}{" "}
              em nenhuma peça do site, ocupando {formatSize(orphanBytes)}. Elas
              sobram quando uma peça é apagada ou quando uma foto é trocada — o
              arquivo antigo continua guardado. Apagar é seguro: o site não usa
              nenhuma delas.
            </p>
            <StorageCleanup
              count={orphans.length}
              label={formatSize(orphanBytes)}
            />
          </>
        )}
      </section>

      <section aria-labelledby="por-peca" className="flex flex-col gap-4">
        <h2 id="por-peca" className="font-display text-2xl font-light">
          Peças que mais ocupam
        </h2>
        {products.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            Nenhuma peça está usando o espaço de fotos ainda.
          </p>
        ) : (
          <ul className="flex flex-col">
            {products.slice(0, 15).map((product) => (
              <li
                key={product.id}
                className="flex items-center gap-4 border-b border-border-subtle py-3 last:border-0"
              >
                <Link
                  href={`/admin/produtos/${product.id}`}
                  className="min-w-0 flex-1 truncate text-sm text-foreground transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground-accent"
                >
                  {product.name}
                </Link>
                <span className="shrink-0 text-xs text-foreground-muted">
                  {product.photos}{" "}
                  {product.photos === 1 ? "foto" : "fotos"}
                </span>
                <span className="w-20 shrink-0 text-right text-sm tabular-nums text-foreground">
                  {formatSize(product.bytes)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="max-w-[60ch] border-t border-border-subtle pt-6 text-xs text-foreground-muted">
        As fotos que vieram do site antigo não entram nesta conta: elas ficam
        junto com o código, não no banco, e não ocupam esse limite.
      </p>
    </div>
  );
};

const Figure = ({
  value,
  label,
  hint,
  strong = false,
}: {
  value: string;
  label: string;
  hint: string;
  strong?: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <dt className="text-xs tracking-[0.2em] text-foreground-muted uppercase">
      {label}
    </dt>
    <dd
      className={`font-display text-3xl font-light tabular-nums ${
        strong ? "text-foreground-accent" : "text-foreground"
      }`}
    >
      {value}
    </dd>
    <p className="text-xs text-foreground-muted">{hint}</p>
  </div>
);
