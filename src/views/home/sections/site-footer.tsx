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

    {/*
      `pe-20` on small screens keeps this row clear of the floating WhatsApp
      button, which is fixed to the same corner. The padlock also leads the row
      rather than closing it, so the one thing a customer must never tap by
      accident is nowhere near the one they are meant to.
    */}
    <div className="container-page flex flex-wrap items-center gap-x-4 gap-y-2 pb-10 pe-20 text-xs text-foreground-muted sm:pe-0">
      {/* The shop's own door — a padlock rather than a sentence, so it reads as
          staff-only. The icon is small, the tap target is not. */}
      <Link
        href="/admin"
        aria-label="Área administrativa"
        title="Área administrativa"
        className="-ms-3 -my-3 flex size-11 items-center justify-center rounded-control text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      </Link>

      <p>
        © {new Date().getFullYear()} Renova Closet. Todos os direitos reservados.
      </p>

      <Link
        href="/privacy-policy"
        className="underline underline-offset-4 transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground sm:ms-auto"
      >
        Política de privacidade
      </Link>
    </div>
  </footer>
);
