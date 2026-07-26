import Image from "next/image";
import Link from "next/link";

import type { NavLink, StoreInfo } from "@/data/home";

export interface SiteFooterProps {
  nav: NavLink[];
  store: StoreInfo;
}

export const SiteFooter = ({ nav, store }: SiteFooterProps) => (
  <footer className="border-t border-border-subtle">
    <div className="container-page flex flex-col gap-10 py-12 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-col items-start gap-4">
        {/*
          Built from the mark plus text rather than the lockup image, for the
          same reason the header is: the lockup's wordmark is black artwork, so
          it disappears against the dark theme. Text takes the theme's colour.
          `items-start` above matters too — a flex column stretches its children,
          which was distorting the image regardless of `w-auto`.
        */}
        <div className="flex items-center gap-3">
          <Image
            src="/assets/brand/renova-hanger.png"
            alt=""
            width={780}
            height={518}
            className="h-8 w-auto"
          />
          <span className="flex flex-col font-display leading-none">
            <span className="text-lg tracking-[0.3em] text-foreground">
              RENOVA
            </span>
            <span className="text-[0.6875rem] font-light tracking-[0.45em] text-foreground-muted">
              CLOSET
            </span>
          </span>
        </div>
        <address className="text-sm text-foreground-muted not-italic">
          {store.street} — {store.city}, {store.state}
        </address>
      </div>

      <nav aria-label="Rodapé">
        <ul className="flex flex-col gap-3">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <ul className="flex flex-col gap-3">
        <li>
          <a
            href={store.whatsappHref}
            target="_blank"
            rel="noopener"
            className="text-sm text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
          >
            WhatsApp {store.phoneLabel}
          </a>
        </li>
        <li>
          <a
            href={store.instagramHref}
            target="_blank"
            rel="noopener"
            className="text-sm text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
          >
            Instagram {store.instagramLabel}
          </a>
        </li>
        <li>
          <a
            href={store.vipGroupHref}
            target="_blank"
            rel="noopener"
            className="text-sm text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
          >
            Grupo VIP no WhatsApp
          </a>
        </li>
      </ul>
    </div>

    <div className="container-page flex flex-wrap items-center justify-between gap-3 pb-10 text-xs text-foreground-muted">
      <p>
        © {new Date().getFullYear()} Renova Closet. Todos os direitos reservados.
      </p>
      <Link
        href="/privacy-policy"
        className="underline underline-offset-4 transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
      >
        Política de privacidade
      </Link>
      {/* The shop's own door. Discreet rather than hidden: the area is
          `noindex` and disallowed in robots.txt, so it costs nothing here and
          saves typing the address on a phone. */}
      <Link
        href="/admin"
        className="underline underline-offset-4 transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
      >
        Área administrativa
      </Link>
    </div>
  </footer>
);
