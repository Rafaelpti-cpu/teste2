import type { StorageUsage } from "@/lib/catalog/storage";

export interface StorageMeterProps {
  usage: StorageUsage;
}

/** Above this the bar changes colour and the wording stops being neutral. */
const ATTENTION = 75;
const ALARM = 90;

const formatSize = (bytes: number) => {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(2).replace(".", ",")} GB`;
  return `${mb.toFixed(mb < 10 ? 1 : 0).replace(".", ",")} MB`;
};

/**
 * How much photo storage is left.
 *
 * Shown in the admin chrome rather than tucked into a settings page: a number
 * you only see when you go looking for it is a number you see for the first
 * time on the day it runs out. Below 75 % it is a quiet line; past that it
 * starts saying what to do about it.
 */
export const StorageMeter = ({ usage }: StorageMeterProps) => {
  const alarm = usage.percent >= ALARM;
  const attention = usage.percent >= ATTENTION;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs">
        <span className="text-foreground-muted">
          Espaço das fotos —{" "}
          <strong className="font-medium text-foreground">
            {formatSize(usage.usedBytes)}
          </strong>{" "}
          de {formatSize(usage.limitBytes)} · {usage.files}{" "}
          {usage.files === 1 ? "foto" : "fotos"}
        </span>
        <span
          className={
            alarm
              ? "font-medium text-foreground-accent"
              : "text-foreground-muted"
          }
        >
          {usage.percent}%
        </span>
      </div>

      <span
        role="progressbar"
        aria-valuenow={usage.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Espaço das fotos usado"
        className="block h-1.5 w-full overflow-hidden rounded-pill bg-surface-muted"
      >
        <span
          className={`block h-full rounded-pill ${
            alarm
              ? "bg-action-primary"
              : attention
                ? "bg-decor-accent"
                : "bg-decor-accent-soft"
          }`}
          style={{ width: `${Math.max(usage.percent, 1)}%` }}
        />
      </span>

      {alarm && (
        <p className="text-xs text-foreground-accent">
          O espaço está quase no fim. Quando encher, o site não deixa mais
          adicionar fotos. Apague fotos de peças que saíram do catálogo para
          liberar.
        </p>
      )}
      {attention && !alarm && (
        <p className="text-xs text-foreground-muted">
          Já passou de três quartos. Vale ir apagando peças antigas de vez em
          quando.
        </p>
      )}
    </div>
  );
};
