import Link from "next/link";

import type { MetricsSummary } from "@/types/analytics";

export interface MetricsBoardProps {
  summary: MetricsSummary;
  ranges: number[];
}

/** `2026-07-28` → `28/07`. Built by hand: the string is already local. */
const shortDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

const RANGE_LABEL: Record<number, string> = {
  7: "7 dias",
  30: "30 dias",
  90: "90 dias",
};

/**
 * The metrics screen.
 *
 * A Server Component with no chart library: the bars are `<div>`s sized by
 * percentage. A dependency to draw forty rectangles would be the largest thing
 * in the admin bundle, and this survives without JavaScript at all.
 */
export const MetricsBoard = ({ summary, ranges }: MetricsBoardProps) => {
  const peak = Math.max(1, ...summary.daily.map((entry) => entry.views));
  const rate =
    summary.views > 0
      ? Math.round((summary.whatsapp / summary.views) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-10">
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

      <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        <Figure
          value={summary.visits}
          label="Visitas"
          hint="Pessoas diferentes que abriram o site no período."
        />
        <Figure
          value={summary.views}
          label="Páginas vistas"
          hint="Cada peça aberta e cada página conta uma vez."
        />
        <Figure
          value={summary.whatsapp}
          label="Cliques no WhatsApp"
          hint="Quantas conversas o site começou."
        />
        <Figure
          value={`${rate}%`}
          label="Viraram conversa"
          hint="De cada 100 páginas vistas, quantas foram para o WhatsApp."
        />
      </dl>

      <section aria-labelledby="por-dia" className="flex flex-col gap-4">
        <h2 id="por-dia" className="font-display text-xl font-light">
          Por dia
        </h2>
        <ul className="flex flex-col gap-1">
          {summary.daily.map((entry) => (
            <li key={entry.day} className="flex items-center gap-3 text-sm">
              <span className="w-12 shrink-0 tabular-nums text-foreground-muted">
                {shortDay(entry.day)}
              </span>
              <span className="h-5 flex-1 overflow-hidden rounded-control bg-surface-muted">
                <span
                  className="block h-full rounded-control bg-decor-accent-soft"
                  style={{ width: `${(entry.views / peak) * 100}%` }}
                />
              </span>
              <span className="w-10 shrink-0 text-right tabular-nums text-foreground">
                {entry.views}
              </span>
              <span
                className="w-16 shrink-0 text-right tabular-nums text-foreground-muted"
                title="Cliques no WhatsApp"
              >
                {entry.whatsapp > 0 ? `${entry.whatsapp} 💬` : "—"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="por-peca" className="flex flex-col gap-4">
        <h2 id="por-peca" className="font-display text-xl font-light">
          Peças mais procuradas
        </h2>

        {summary.products.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            Ainda não há registro de peças abertas neste período.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-foreground-muted">
                  <th className="py-2 font-normal">Peça</th>
                  <th className="py-2 text-right font-normal">Aberturas</th>
                  <th className="py-2 text-right font-normal">WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {summary.products.map((product) => (
                  <tr
                    key={product.slug}
                    className="border-b border-border-subtle last:border-0"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/produto/${product.slug}`}
                        className="underline underline-offset-4 transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground-accent"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      {product.views}
                    </td>
                    <td className="py-3 text-right tabular-nums font-medium">
                      {product.whatsapp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="max-w-[60ch] text-xs text-foreground-muted">
        A contagem não usa cookies e não guarda nada sobre quem visitou — nem
        e-mail, nem localização, nem o aparelho. Uma visita é um navegador com
        uma aba aberta; se a mesma pessoa voltar amanhã, conta de novo.
      </p>
    </div>
  );
};

const Figure = ({
  value,
  label,
  hint,
}: {
  value: number | string;
  label: string;
  hint: string;
}) => (
  <div className="flex flex-col gap-1">
    <dt className="text-xs tracking-[0.2em] text-foreground-muted uppercase">
      {label}
    </dt>
    <dd className="font-display text-4xl font-light tabular-nums text-foreground">
      {value}
    </dd>
    <p className="text-xs text-foreground-muted">{hint}</p>
  </div>
);
