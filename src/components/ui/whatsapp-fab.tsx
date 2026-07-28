// 📖 Docs: obsidian/frontend/components/ui.md
"use client";

import { useRef, useState } from "react";

import { useCookieStore } from "@/components/common/Cookie";
import { useLoop } from "@/hooks/animation/use-render-loop";
import { prefersReducedMotion } from "@/lib/scene/device";

import { WhatsAppGlyph } from "./whatsapp-glyph";

export interface WhatsAppFabProps {
  href: string;
  /** Shown on hover/focus and read by screen readers. */
  label?: string;
}

/** Period of one pulse, in ms. Slow enough to invite rather than nag. */
const PULSE_MS = 2600;

/**
 * Floating WhatsApp button.
 *
 * The halo pulses on the app-wide ticker rather than a CSS animation:
 * `@keyframes` are banned here, and a spring cannot express a loop. The loop
 * writes two style properties on a ref, so it never re-renders React.
 *
 * It hides itself while the cookie banner is up — both live bottom-right, and
 * a button behind a banner is worse than no button.
 */
export const WhatsAppFab = ({
  href,
  label = "Falar no WhatsApp",
}: WhatsAppFabProps) => {
  const haloRef = useRef<HTMLSpanElement>(null);
  const [reduced] = useState(() => prefersReducedMotion());

  const consent = useCookieStore((state) => state.consent);
  const hydrated = useCookieStore((state) => state.hydrated);
  // Before hydration we do not know yet; showing then hiding would flicker.
  const bannerUp = hydrated && consent === null;

  useLoop(
    (time) => {
      const halo = haloRef.current;
      if (!halo) return;
      // 0 → 1 sawtooth: the ring grows out and fades as it goes.
      const t = (time % PULSE_MS) / PULSE_MS;
      halo.style.transform = `scale(${1 + t * 0.85})`;
      halo.style.opacity = `${(1 - t) * 0.45}`;
    },
    { framerate: 1000 / 30 },
  );

  if (bannerUp) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label={label}
      className="group fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-pill bg-action-whatsapp text-action-whatsapp-foreground shadow-[0_0.75rem_2rem_-0.5rem_rgba(0,0,0,0.45)] transition-transform duration-[var(--duration-normal)] ease-entrance hover:scale-105 focus-visible:scale-105 sm:right-8 sm:bottom-8 sm:size-16"
    >
      {/* The halo. Decorative, and skipped entirely under reduced motion. */}
      {!reduced && (
        <span
          ref={haloRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-pill bg-action-whatsapp"
        />
      )}

      <WhatsAppGlyph className="relative size-7 sm:size-8" />
    </a>
  );
};
