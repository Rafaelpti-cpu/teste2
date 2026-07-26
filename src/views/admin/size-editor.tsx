"use client";

import { useState } from "react";

import { SIZE_PRESETS } from "@/types/catalog";

export interface SizeEditorProps {
  value: string[];
  onChange: (sizes: string[]) => void;
}

/**
 * Available sizes as removable chips, plus one-tap runs (PP–XG, 36–46…).
 * Order is preserved: the shop decides how the grade reads.
 */
export const SizeEditor = ({ value, onChange }: SizeEditorProps) => {
  const [draft, setDraft] = useState("");

  const add = (size: string) => {
    const clean = size.trim().toUpperCase();
    if (!clean || value.includes(clean)) return;
    onChange([...value, clean]);
  };

  const addPreset = (sizes: string[]) => {
    onChange([...value, ...sizes.filter((size) => !value.includes(size))]);
  };

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-foreground">
        Tamanhos disponíveis
      </legend>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((size) => (
            <li key={size}>
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== size))}
                className="group flex items-center gap-2 rounded-pill border border-border-subtle bg-surface-raised px-4 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-entrance hover:border-border-strong"
                aria-label={`Remover tamanho ${size}`}
              >
                {size}
                <span
                  aria-hidden="true"
                  className="text-foreground-muted group-hover:text-foreground-accent"
                >
                  ×
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="size-draft">
          Novo tamanho
        </label>
        <input
          id="size-draft"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            // The form would submit otherwise, saving a half-filled product.
            event.preventDefault();
            add(draft);
            setDraft("");
          }}
          placeholder="P, M, 38…"
          className="w-32 rounded-control border border-border-subtle bg-surface-raised px-3 py-2.5 text-sm outline-none focus-visible:border-action-primary"
        />
        <button
          type="button"
          onClick={() => {
            add(draft);
            setDraft("");
          }}
          className="rounded-control border border-border-strong px-4 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-surface-inverse hover:text-foreground-inverse"
        >
          Adicionar
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-foreground-muted">Grades prontas:</span>
        {Object.entries(SIZE_PRESETS).map(([label, sizes]) => (
          <button
            key={label}
            type="button"
            onClick={() => addPreset(sizes)}
            className="rounded-pill bg-surface-muted px-3 py-2 text-xs text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
          >
            {label}
          </button>
        ))}
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="rounded-pill px-3 py-1 text-xs text-foreground-muted underline underline-offset-4 transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground-accent"
          >
            Limpar
          </button>
        )}
      </div>
    </fieldset>
  );
};
