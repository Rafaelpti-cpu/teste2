"use client";

import { useEffect } from "react";

/**
 * Route-segment error boundary. Must be a Client Component. Catches render and
 * data errors in this segment and offers a recovery action via `reset()`.
 *
 * The WhatsApp way out matters more than the retry: if the site is broken, the
 * customer should still be able to reach the shop.
 */
/**
 * A chunk that no longer exists.
 *
 * Every deploy renames the JavaScript files. A browser holding a page from the
 * previous build — an open tab, a bfcache restore, a cached document — asks for
 * a filename that is gone and the import rejects. The customer sees a broken
 * site; a reload fixes it, because the fresh HTML points at the current names.
 *
 * The wording varies by browser and by bundler, so this matches on the family
 * rather than an exact string.
 */
const isStaleBuild = (error: Error) => {
  const text = `${error.name} ${error.message}`;
  return (
    /ChunkLoadError/i.test(text) ||
    /Loading chunk [\w-]+ failed/i.test(text) ||
    /(dynamically imported module|importing a module script failed)/i.test(text)
  );
};

/** Guards the auto-reload, so a genuinely broken build cannot loop forever. */
const RELOAD_KEY = "renova.reloaded-at";
const RELOAD_COOLDOWN_MS = 60_000;

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

    if (!isStaleBuild(error)) return;

    /*
      Reload once, not on a loop. If the reload lands on a build that is still
      broken, the timestamp keeps this from thrashing and the customer gets the
      page below — which at least offers WhatsApp.
    */
    try {
      const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
      if (Date.now() - last < RELOAD_COOLDOWN_MS) return;
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
      window.location.reload();
    } catch {
      // Storage unavailable — better to show the page than to risk a loop.
    }
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

        {/*
          The digest is the only handle on what actually failed — the browser
          console is not somewhere a customer looks, and the server log is not
          somewhere the shop can reach. Small and unlabelled-as-jargon, so it
          reads as a reference number rather than as a leak.
        */}
        {error.digest && (
          <p className="text-xs text-foreground-muted">
            Código do erro: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
