// 📖 Docs: obsidian/frontend/components/ui.md
"use client";

import { useRef, useState } from "react";

import { useCookieStore } from "@/components/common/Cookie";
import { useLoop } from "@/hooks/animation/use-render-loop";
import { prefersReducedMotion } from "@/lib/scene/device";

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

      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="relative size-7 fill-current sm:size-8"
      >
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.08-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.470 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.21-8.24 8.21z" />
      </svg>
    </a>
  );
};
