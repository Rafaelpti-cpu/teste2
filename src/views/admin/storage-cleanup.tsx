"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface StorageCleanupProps {
  count: number;
  label: string;
}

/**
 * The sweep button.
 *
 * Confirms first, because this deletes files and there is no undo. The count
 * and size are in the confirmation rather than only above it — the shop should
 * be able to read what is about to happen without scrolling back.
 */
export const StorageCleanup = ({ count, label }: StorageCleanupProps) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sweep = async () => {
    const ok = window.confirm(
      `Apagar ${count} ${count === 1 ? "foto solta" : "fotos soltas"} e liberar ${label}?\n\nElas não estão em nenhuma peça do site. Não dá para desfazer.`,
    );
    if (!ok) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/espaco", { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Não foi possível limpar.");
      }
      setDone(`${body.data.removed} apagadas.`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível limpar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={sweep}
        disabled={busy}
        className="rounded-pill bg-action-primary px-6 py-3 text-sm font-medium text-action-primary-foreground transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-action-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Limpando…" : `Apagar as ${count} e liberar ${label}`}
      </button>
      {done && <span className="text-sm text-foreground-muted">{done}</span>}
      {error && (
        <span role="alert" className="text-sm text-foreground-accent">
          {error}
        </span>
      )}
    </div>
  );
};
