"use client";

import type { ProductColor } from "@/types/catalog";

export interface ColorEditorProps {
  value: ProductColor[];
  onChange: (colors: ProductColor[]) => void;
}

const DEFAULT_COLOR: ProductColor = { name: "", hex: "#f08c98" };

/**
 * Available colourways — a name the customer reads plus a swatch.
 *
 * Both halves matter: the swatch alone cannot say "off-white" versus "cream",
 * and the name alone cannot be rendered as a dot on the product card.
 */
export const ColorEditor = ({ value, onChange }: ColorEditorProps) => {
  const update = (index: number, patch: Partial<ProductColor>) => {
    onChange(
      value.map((color, i) => (i === index ? { ...color, ...patch } : color)),
    );
  };

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-foreground">
        Cores disponíveis
      </legend>

      {value.length > 0 && (
        <ul className="flex flex-col gap-2">
          {value.map((color, index) => (
            // Index keys are correct here: rows have no identity of their own
            // and reordering is not offered.
            <li key={index} className="flex items-center gap-2">
              <input
                type="color"
                value={color.hex}
                onChange={(event) => update(index, { hex: event.target.value })}
                aria-label={`Cor ${index + 1}`}
                className="size-10 shrink-0 cursor-pointer rounded-control border border-border-subtle bg-surface-raised"
              />
              <input
                value={color.name}
                onChange={(event) => update(index, { name: event.target.value })}
                placeholder="Nome da cor (ex.: Marrom café)"
                aria-label={`Nome da cor ${index + 1}`}
                className="min-w-0 flex-1 rounded-control border border-border-subtle bg-surface-raised px-3 py-2.5 text-sm outline-none focus-visible:border-action-primary"
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                aria-label={`Remover cor ${color.name || index + 1}`}
                className="shrink-0 rounded-control px-3 py-2.5 text-sm text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground-accent"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => onChange([...value, { ...DEFAULT_COLOR }])}
        className="self-start rounded-control border border-border-strong px-4 py-2.5 text-sm transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-surface-inverse hover:text-foreground-inverse"
      >
        Adicionar cor
      </button>
    </fieldset>
  );
};
