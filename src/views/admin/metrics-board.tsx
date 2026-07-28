import Link from "next/link";

import type { MetricsSummary, ProductCount } from "@/types/analytics";

import { MetricsChart } from "./metrics-chart";

export interface MetricsBoardProps {
  summary: MetricsSummary;
  ranges: number[];
}

const RANGE_LABEL: Record<number, string> = {
  7: "7 dias",
  30: "30 dias",
  90: "90 dias",
};

/** How many pieces the ranking shows before the rest are folded away. */
const RANKED = 10;

/**
 * The metrics screen.
 *
 * Three questions, in the order the shop asks them: how did the site do, how is
 * that changing, and which pieces did it. No chart library — see
 * [[metrics-chart]] for why.
 */
export const MetricsBoard = ({ summary, ranges }: MetricsBoardProps) => {
  const rate =
    summary.views > 0 ? Math.round((summary.whatsapp / summary.views) * 100) : 0;
  const top = summary.products.slice(0, RANKED);
  const rest = summary.products.length - top.length;

  return (
    <div className="flex flex-col gap-12">
      <nav aria-label="Período" className="flex flex-wrap gap-2">
        {ranges.map((days) => (
          <Link
            key={days}
            href={`/admin/medicoes?dias=${days}`}
            aria-current={days === summary.days ? "page" : undefined}
            className={`rounded-pill border px-4 py-2 text-sm transition-colors duration-[var(--duration-fast)] ease-entrance ${
              days === summary.days
                ? "border-action-primary bg-action-primary text-action-primary-foreground"
                : "border-border-subtle text-foreground-muted hover:text-foreground"
            }`}
          >
            {RANGE_LABEL[days] ?? `${days} dias`}
          </Link>
        ))}
      </nav>

      {summary.truncated && (
        <p className="rounded-card border border-border-subtle bg-surface-muted p-4 text-sm text-foreground-muted">
          Este período passou do limite de registros que a tela lê de uma vez, e
          os números abaixo são parciais. Escolha um período menor para ver a
          contagem cheia.
        </p>
      )}

      <section aria-labelledby="resumo" className="flex flex-col gap-6">
        <h2 id="resumo" className="sr-only">
          Resumo do período
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          <Figure
            value={summary.visits}
            label="Visitas"
            hint="Pessoas diferentes que abriram o site."
          />
          <Figure
            value={summary.views}
            label="Páginas vistas"
            hint="Cada peça aberta conta uma."
          />
          <Figure
            value={summary.whatsapp}
            label="Conversas"
            hint="Cliques no botão do WhatsApp."
            strong
          />
          <Figure
            value={`${rate}%`}
            label="Viraram conversa"
            hint="De cada 100 páginas vistas."
          />
        </dl>
      </section>

      <section aria-labelledby="movimento" className="flex flex-col gap-5">
        <h2 id="movimento" className="font-display text-2xl font-light">
          Movimento
        </h2>
        <MetricsChart daily={summary.daily} />
      </section>

      <section aria-labelledby="pecas" className="flex flex-col gap-5">
        <h2 id="pecas" className="font-display text-2xl font-light">
          Peças mais procuradas
        </h2>

        {top.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            Ainda não há registro de peças abertas neste período. Assim que
            alguém abrir uma peça no site, ela aparece aqui.
          </p>
        ) : (
          <>
            <p className="max-w-[60ch] text-sm text-foreground-muted">
              Ordenadas por conversas, não por visualizações. Muita abertura e
              nenhuma conversa costuma ser peça que a foto promete e a descrição
              não entrega.
            </p>
            <ol className="flex flex-col">
              {top.map((product, index) => (
                <ProductRank
                  key={product.slug}
                  product={product}
                  position={index + 1}
                  peak={Math.max(1, ...top.map((entry) => entry.views))}
                />
              ))}
            </ol>
            {rest > 0 && (
              <p className="text-sm text-foreground-muted">
                E mais {rest} {rest === 1 ? "peça" : "peças"} com menos
                movimento.
              </p>
            )}
          </>
        )}
      </section>

      <p className="max-w-[60ch] border-t border-border-subtle pt-6 text-xs text-foreground-muted">
        A contagem não usa cookies e não guarda nada sobre quem visitou — nem
        e-mail, nem localização, nem o aparelho. Uma visita é um navegador com
        uma aba aberta; se a mesma pessoa voltar amanhã, conta de novo. Suas
        próprias visitas ao admin não entram na conta.
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
  value: number | string;
  label: string;
  hint: string;
  strong?: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <dt className="text-xs tracking-[0.2em] text-foreground-muted uppercase">
      {label}
    </dt>
    <dd
      className={`font-display text-4xl font-light tabular-nums ${
        strong ? "text-foreground-accent" : "text-foreground"
      }`}
    >
      {value}
    </dd>
    <p className="text-xs text-foreground-muted">{hint}</p>
  </div>
);

const ProductRank = ({
  product,
  position,
  peak,
}: {
  product: ProductCount;
  position: number;
  peak: number;
}) => {
  const rate =
    product.views > 0 ? Math.round((product.whatsapp / product.views) * 100) : 0;

  return (
    <li className="flex items-center gap-4 border-b border-border-subtle py-4 last:border-0">
      <span className="w-6 shrink-0 font-display text-lg font-light tabular-nums text-foreground-muted">
        {position}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Link
          href={`/produto/${product.slug}`}
          className="truncate text-sm text-foreground transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground-accent"
        >
          {product.name}
        </Link>
        <span
          aria-hidden="true"
          className="h-1 w-full overflow-hidden rounded-pill bg-surface-muted"
        >
          <span
            className="block h-full rounded-pill bg-decor-accent-soft"
            style={{ width: `${(product.views / peak) * 100}%` }}
          />
        </span>
      </div>

      <div className="flex shrink-0 items-baseline gap-4 text-right">
        <span className="text-sm tabular-nums text-foreground-muted">
          {product.views}
          <span className="sr-only"> aberturas</span>
        </span>
        <span className="font-display text-xl font-light tabular-nums text-foreground">
          {product.whatsapp}
          <span className="sr-only"> conversas</span>
        </span>
        <span className="w-10 text-xs tabular-nums text-foreground-muted">
          {product.views > 0 ? `${rate}%` : "—"}
        </span>
      </div>
    </li>
  );
};
