"use client";

import { SpringTrigger } from "@/components/animation/springs/spring-trigger";

export interface MarqueeProps {
  items: string[];
}

/**
 * A rail of claims that slides as the page scrolls.
 *
 * Scroll-driven rather than looping on a timer: a keyframed marquee is banned
 * here, and tying the motion to scroll means it only moves while the reader is
 * moving — which is both cheaper and less distracting. The list is duplicated
 * once so the rail stays full at both ends of the travel.
 */
export const Marquee = ({ items }: MarqueeProps) => {
  const rail = [...items, ...items, ...items];

  return (
    <SpringTrigger
      tag="section"
      innerTag="ul"
      mode="scrub"
      start="top bottom"
      end="bottom top"
      from={{ x: "0%" }}
      to={{ x: "-28%" }}
      aria-label="Vantagens da loja"
      className="scrollbar-none overflow-hidden border-y border-border-subtle bg-surface-muted py-4"
      innerClassName="flex w-max items-center gap-10"
    >
      {rail.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="flex shrink-0 items-center gap-10 font-display text-sm tracking-[0.2em] text-foreground-muted uppercase"
          // The rail repeats for visual continuity; only the first pass is
          // meaningful to a screen reader.
          aria-hidden={index >= items.length}
        >
          <span aria-hidden="true" className="text-decor-accent">
            ✦
          </span>
          {item}
        </li>
      ))}
    </SpringTrigger>
  );
};
