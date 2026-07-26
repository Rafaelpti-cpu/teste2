"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Spring } from "@/components/animation/springs/spring";
import type { NavLink } from "@/data/home";

export interface SiteHeaderProps {
  nav: NavLink[];
  whatsappHref: string;
}

/**
 * Sticky header. A sentinel at the very top of the document reports whether the
 * page has scrolled; the backdrop springs in from that flag rather than from a
 * scroll handler, so nothing reads layout on every event.
 */
export const SiteHeader = ({ nav, whatsappHref }: SiteHeaderProps) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="absolute top-0 h-px w-full" />
      <header className="sticky top-0 z-50">
        <Spring
          tag="div"
          enabled={stuck}
          from={{ opacity: 0 }}
          to={{ opacity: 1 }}
          config={{ tension: 140, friction: 30 }}
          className="pointer-events-none absolute inset-0 border-b border-border-subtle bg-background/85 backdrop-blur-md"
        />
        <div className="container-page relative flex items-center justify-between gap-6 py-4">
          <Link
            href="/"
            aria-label="Renova Closet — página inicial"
            className="flex items-center gap-3"
          >
            <Image
              src="/assets/brand/renova-hanger.png"
              alt=""
              width={780}
              height={518}
              className="h-6 w-auto"
              priority
            />
            <span className="flex flex-col font-display leading-none">
              <span className="text-base tracking-[0.3em] text-foreground">
                RENOVA
              </span>
              <span className="text-[0.625rem] font-light tracking-[0.45em] text-foreground-muted">
                CLOSET
              </span>
            </span>
          </Link>

          <nav aria-label="Seções da página" className="hidden lg:block">
            <ul className="flex items-center gap-8">
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

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener"
            className="rounded-pill bg-action-primary px-5 py-2.5 text-sm font-medium text-action-primary-foreground transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-action-primary-hover"
          >
            WhatsApp
          </a>
        </div>
      </header>
    </>
  );
};
