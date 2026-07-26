"use client";

import { useEffect } from "react";

/**
 * Route-segment error boundary. Must be a Client Component. Catches render and
 * data errors in this segment and offers a recovery action via `reset()`.
 *
 * The WhatsApp way out matters more than the retry: if the site is broken, the
 * customer should still be able to reach the shop.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for logging/monitoring (kept by removeConsole's exclude).
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-lvh place-items-center px-6 py-16">
      <div className="flex max-w-[38ch] flex-col items-center gap-6 text-center">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-3xl font-light text-foreground">
            Algo deu errado por aqui
          </h1>
          <p className="text-sm text-foreground-muted">
            Tenta de novo em um instante. Se continuar assim, fala com a gente no
            WhatsApp que resolvemos por lá.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-pill bg-action-primary px-6 py-3 text-sm font-medium text-action-primary-foreground transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-action-primary-hover"
          >
            Tentar de novo
          </button>
          <a
            href="https://wa.me/5545988255705?text=Ol%C3%A1!%20Vim%20pelo%20site."
            target="_blank"
            rel="noopener"
            className="rounded-pill border border-border-strong px-6 py-3 text-sm transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-surface-inverse hover:text-foreground-inverse"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
