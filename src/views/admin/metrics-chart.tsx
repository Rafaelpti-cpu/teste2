import type { DailyCount } from "@/types/analytics";

export interface MetricsChartProps {
  daily: DailyCount[];
}

/** `2026-07-28` → `28/07`. The string is already local; no Date needed. */
const shortDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

/**
 * Two stacked bar charts sharing one timeline: pieces looked at, and
 * conversations started.
 *
 * Inline SVG rather than a chart library — this draws rectangles, and a
 * dependency to do that would be the heaviest thing in the admin bundle. A
 * `viewBox` with `preserveAspectRatio="none"` lets the bars stretch to whatever
 * width the phone has, so 7 days and 90 days both fill the space without any
 * measuring in JavaScript.
 *
 * The two are drawn separately rather than stacked in one chart because a
 * WhatsApp click is not a subset of a view — the same visit produces both, and
 * stacking them would invent a total that means nothing.
 */
export const MetricsChart = ({ daily }: MetricsChartProps) => {
  const peakViews = Math.max(1, ...daily.map((entry) => entry.views));
  const peakChats = Math.max(1, ...daily.map((entry) => entry.whatsapp));
  const anyChats = daily.some((entry) => entry.whatsapp > 0);

  // One unit of width per day, so the bar count never changes the geometry.
  const width = daily.length;
  const gap = daily.length > 45 ? 0.15 : 0.3;
  const barWidth = 1 - gap;

  return (
    <div className="flex flex-col gap-6">
      <Panel
        label="Páginas vistas"
        total={daily.reduce((sum, entry) => sum + entry.views, 0)}
      >
        <svg
          viewBox={`0 0 ${width} 100`}
          preserveAspectRatio="none"
          aria-hidden="true"
          className="h-32 w-full"
        >
          {daily.map((entry, index) => {
            const height = (entry.views / peakViews) * 100;
            return (
              <rect
                key={entry.day}
                x={index + gap / 2}
                y={100 - height}
                width={barWidth}
                height={height}
                className="fill-decor-accent-soft"
              />
            );
          })}
        </svg>
      </Panel>

      <Panel
        label="Conversas iniciadas"
        total={daily.reduce((sum, entry) => sum + entry.whatsapp, 0)}
      >
        {anyChats ? (
          <svg
            viewBox={`0 0 ${width} 100`}
            preserveAspectRatio="none"
            aria-hidden="true"
            className="h-16 w-full"
          >
            {daily.map((entry, index) => {
              const height = (entry.whatsapp / peakChats) * 100;
              return (
                <rect
                  key={entry.day}
                  x={index + gap / 2}
                  y={100 - height}
                  width={barWidth}
                  height={height}
                  className="fill-action-whatsapp"
                />
              );
            })}
          </svg>
        ) : (
          <p className="flex h-16 items-center text-sm text-foreground-muted">
            Nenhuma conversa começou pelo site neste período.
          </p>
        )}
      </Panel>

      <div className="flex justify-between text-xs text-foreground-muted">
        <span>{daily.length > 0 && shortDay(daily[0].day)}</span>
        <span>{daily.length > 0 && shortDay(daily[daily.length - 1].day)}</span>
      </div>

      {/*
        The charts are `aria-hidden`; this is what a screen reader gets instead.
        A 90-bar SVG read aloud is noise — the busiest day and the total are the
        two facts the shape is there to convey.
      */}
      <p className="sr-only">
        {describe(daily)}
      </p>
    </div>
  );
};

const describe = (daily: DailyCount[]) => {
  if (daily.length === 0) return "Sem dados no período.";
  const busiest = daily.reduce((best, entry) =>
    entry.views > best.views ? entry : best,
  );
  const views = daily.reduce((sum, entry) => sum + entry.views, 0);
  const chats = daily.reduce((sum, entry) => sum + entry.whatsapp, 0);
  return `No período: ${views} páginas vistas e ${chats} conversas iniciadas. O dia mais movimentado foi ${shortDay(busiest.day)}, com ${busiest.views} páginas vistas.`;
};

const Panel = ({
  label,
  total,
  children,
}: {
  label: string;
  total: number;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-baseline justify-between border-b border-border-subtle pb-2">
      <h3 className="text-xs tracking-[0.2em] text-foreground-muted uppercase">
        {label}
      </h3>
      <span className="font-display text-lg font-light tabular-nums text-foreground">
        {total}
      </span>
    </div>
    {children}
  </div>
);
