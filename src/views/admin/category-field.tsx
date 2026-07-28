"use client";

import { useRef, useState } from "react";

import { CATEGORY_MAX_LENGTH } from "@/types/catalog";

export interface CategoryFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Sections already in use, in the order the site shows them. */
  options: string[];
  className?: string;
}

/** Sentinel for the "type a new one" entry — no category may equal it. */
const NEW = "__nova__";

/**
 * Pick a section, or invent one.
 *
 * A `<select>` rather than a text field with suggestions, because on a phone
 * the native picker is a full-screen wheel the shop already knows how to use,
 * and it makes reusing an existing section the path of least resistance. That
 * matters: "Feminino" and "feminino " typed by hand are two sections on the
 * site, and nothing warns anyone.
 */
export const CategoryField = ({
  value,
  onChange,
  options,
  className = "",
}: CategoryFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  // Editing starts on when the product already sits in a section that is gone.
  const [typing, setTyping] = useState(
    () => value !== "" && !options.includes(value),
  );

  if (typing) {
    return (
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          id="category"
          autoFocus
          required
          maxLength={CATEGORY_MAX_LENGTH}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Acessórios, Praia, Plus size…"
          className={className}
        />
        <button
          type="button"
          onClick={() => {
            setTyping(false);
            onChange(options[0] ?? "");
          }}
          className="self-start text-xs text-foreground-muted underline underline-offset-4 transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
        >
          Escolher uma categoria que já existe
        </button>
      </div>
    );
  }

  return (
    <select
      id="category"
      value={value}
      onChange={(event) => {
        if (event.target.value === NEW) {
          setTyping(true);
          onChange("");
          return;
        }
        onChange(event.target.value);
      }}
      className={className}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
      <option value={NEW}>+ Criar nova categoria…</option>
    </select>
  );
};
