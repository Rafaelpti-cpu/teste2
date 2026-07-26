// 📖 Docs: obsidian/frontend/components/ui.md
import Link from "next/link";

export type ButtonLinkVariant = "primary" | "outline" | "inverse";

export interface ButtonLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: ButtonLinkVariant;
  className?: string;
  /** Accessible name when the label alone is ambiguous out of context. */
  ariaLabel?: string;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill px-7 py-3.5 text-sm font-medium tracking-wide transition-colors duration-[var(--duration-fast)] ease-entrance";

const variants: Record<ButtonLinkVariant, string> = {
  primary:
    "bg-action-primary text-action-primary-foreground hover:bg-action-primary-hover",
  outline:
    "border border-border-strong text-foreground hover:bg-surface-inverse hover:text-foreground-inverse",
  inverse:
    "bg-surface-raised text-foreground hover:bg-action-primary hover:text-action-primary-foreground",
};

/**
 * A link that looks like a button. External hrefs render a plain anchor with
 * `rel="noopener"`; everything else goes through `next/link`.
 */
export const ButtonLink = ({
  href,
  children,
  variant = "primary",
  className = "",
  ariaLabel,
}: ButtonLinkProps) => {
  const classes = `${base} ${variants[variant]} ${className}`;
  const isExternal = href.startsWith("http");

  if (isExternal) {
    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        target="_blank"
        rel="noopener"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} aria-label={ariaLabel}>
      {children}
    </Link>
  );
};
