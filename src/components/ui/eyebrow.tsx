// 📖 Docs: obsidian/frontend/components/ui.md

export interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
  /** Renders the dot and text in the inverse palette (on dark surfaces). */
  tone?: "default" | "inverse";
}

/**
 * Small tracked label that opens a section, prefixed by a brand dot.
 * The dot is decorative, so it is a `span` and not part of the text content.
 */
export const Eyebrow = ({
  children,
  className = "",
  tone = "default",
}: EyebrowProps) => (
  <span
    className={`inline-flex items-center gap-2.5 font-display text-xs uppercase tracking-[0.28em] ${
      tone === "inverse" ? "text-foreground-inverse/70" : "text-foreground-muted"
    } ${className}`}
  >
    <span
      aria-hidden="true"
      className="size-1.5 rounded-pill bg-decor-accent"
    />
    {children}
  </span>
);
