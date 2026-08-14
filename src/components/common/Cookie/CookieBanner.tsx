// 📖 Docs: obsidian/frontend/components/common.md
"use client";

import Link from "next/link";
import { animated, useTransition } from "@react-spring/web";

import { CookieButton } from "./CookieButton";
import { useCookieStore } from "./cookieStore";

export const CookieBanner = () => {
  const consent = useCookieStore((s) => s.consent);
  const hydrated = useCookieStore((s) => s.hydrated);
  const modalOpen = useCookieStore((s) => s.modalOpen);
  const acceptAll = useCookieStore((s) => s.acceptAll);
  const rejectAll = useCookieStore((s) => s.rejectAll);
  const openModal = useCookieStore((s) => s.openModal);

  // Banner shows only after hydration confirmed no prior consent. Hidden while
  // the preferences modal is up so the two surfaces never compete for focus.
  const shouldShow = hydrated && consent === null && !modalOpen;

  // react-spring keeps the node mounted through the leave animation — no
  // manual mount/timeout juggling needed.
  const transitions = useTransition(shouldShow, {
    from: { opacity: 0, y: 24 },
    enter: { opacity: 1, y: 0 },
    leave: { opacity: 0, y: 24 },
    config: { tension: 280, friction: 32 },
  });

  return transitions((style, show) =>
    show ? (
      <animated.section
        aria-label="Aviso de cookies"
        style={{
          opacity: style.opacity,
          transform: style.y.to((v) => `translateY(${v}px)`),
        }}
        /*
          A slim bar, not a card — and the reason is measured, not aesthetic.

          Lighthouse named this banner's paragraph as the Largest Contentful
          Paint element, at 5.8 s across every run. It was the biggest block of
          text on a phone screen, and it is `ssr: false` behind a dynamic
          import, so it painted only once the JavaScript chunk had arrived: a
          990 ms "element render delay" on top of everything else.

          Nothing else on the page paints late. FCP was 0.9–1.0 s in all four
          measurements. The site was being scored on its cookie notice.

          Two lines instead of six puts this below the hero heading in area, so
          the largest paint becomes text that is in the HTML from the first
          byte. The detail did not disappear — "Escolher" still opens the full
          per-category modal, and the privacy policy is one tap away, which is
          where that text belongs anyway.
        */
        className="fixed right-4 bottom-4 left-4 z-50 flex flex-col gap-3 rounded-xl border border-foreground/10 bg-background/95 p-4 font-sans text-foreground shadow-2xl backdrop-blur-xl sm:right-12 sm:bottom-12 sm:left-auto sm:w-[420px] sm:p-5"
      >
        <h2 className="sr-only">Este site usa cookies</h2>
        <p className="text-sm leading-snug text-foreground/70">
          Usamos cookies para o site funcionar e para saber o que as pessoas
          procuram.{" "}
          <Link
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground/70"
          >
            Política de privacidade
          </Link>
          .
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <CookieButton onClick={acceptAll}>Aceitar tudo</CookieButton>
          <CookieButton variant="secondary" onClick={rejectAll}>
            Recusar tudo
          </CookieButton>
          <button
            type="button"
            onClick={openModal}
            className="px-2 py-2 text-sm font-medium leading-none text-foreground underline underline-offset-2 hover:text-foreground/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Escolher
          </button>
        </div>
      </animated.section>
    ) : null,
  );
};
