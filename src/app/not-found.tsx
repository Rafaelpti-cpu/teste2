import Image from "next/image";
import Link from "next/link";

/**
 * 404 page. Rendered for unmatched routes and `notFound()` calls; Next serves
 * it with a 404 status, so crawlers see a proper not-found response.
 *
 * A piece hidden in the admin lands here, which is the common case — hence the
 * way back into the catalogue rather than a bare "page not found".
 */
export default function NotFound() {
  return (
    <main className="grid min-h-lvh place-items-center px-6 py-16">
      <div className="flex max-w-[38ch] flex-col items-center gap-6 text-center">
        <Image
          src="/assets/brand/renova-hanger.png"
          alt=""
          width={780}
          height={518}
          className="w-20 opacity-60"
        />

        <div className="flex flex-col gap-3">
          <h1 className="font-display text-3xl font-light text-foreground">
            Não encontramos esta página
          </h1>
          <p className="text-sm text-foreground-muted">
            O link pode estar antigo, ou a peça saiu do site. Dá uma olhada no
            que chegou agora.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/#novidades"
            className="rounded-pill bg-action-primary px-6 py-3 text-sm font-medium text-action-primary-foreground transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-action-primary-hover"
          >
            Ver as novidades
          </Link>
          <Link
            href="/"
            className="rounded-pill border border-border-strong px-6 py-3 text-sm transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-surface-inverse hover:text-foreground-inverse"
          >
            Ir para o início
          </Link>
        </div>
      </div>
    </main>
  );
}
