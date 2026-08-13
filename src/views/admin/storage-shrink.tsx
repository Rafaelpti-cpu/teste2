"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface StorageShrinkProps {
  count: number;
  label: string;
}

/**
 * Shrinks the photos already in storage, looping until none are left.
 *
 * The endpoint does a handful per call and reports how many remain, so this
 * keeps asking. Progress is shown as it goes: the job can take a minute over a
 * few dozen photos and a button that just sits there looks broken.
 */
export const StorageShrink = ({ count, label }: StorageShrinkProps) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [freed, setFreed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    setDone(0);
    setFreed(0);

    try {
      // Bounded: even if the server kept reporting work, this stops rather than
      // spinning forever against a bug.
      for (let round = 0; round < 60; round += 1) {
        const response = await fetch("/api/admin/espaco/encolher", {
          method: "POST",
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body?.error?.message ?? "Não foi possível encolher.");
        }

        setDone((current) => current + body.data.processed);
        setFreed((current) => current + body.data.freedBytes);

        if (body.data.failed?.length) {
          setError(`Não consegui em ${body.data.failed.length}. As outras seguiram.`);
        }
        if (body.data.remaining === 0) break;
        // No progress and still work left means retrying would only repeat it.
        if (body.data.processed === 0) break;
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível encolher.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="rounded-pill bg-action-primary px-6 py-3 text-sm font-medium text-action-primary-foreground transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-action-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy
          ? `Encolhendo… ${done} de ${count}`
          : `Encolher as ${count} (${label})`}
      </button>

      {!busy && done > 0 && (
        <span className="text-sm text-foreground-muted">
          {done} encolhidas, {(freed / (1024 * 1024)).toFixed(1).replace(".", ",")} MB
          liberados.
        </span>
      )}
      {error && (
        <span role="alert" className="text-sm text-foreground-accent">
          {error}
        </span>
      )}
    </div>
  );
};
