// 📖 Docs: obsidian/frontend/components/ui.md
"use client";

import { easings } from "@react-spring/web";
import TextEngine from "spring-text-engine";

export type RevealAlign = "left" | "center";

export interface RevealHeadingProps {
  children: React.ReactNode;
  /** Semantic level — the tag carries meaning, `className` carries the looks. */
  tag: "h1" | "h2" | "h3";
  className?: string;
  align?: RevealAlign;
  delayIn?: number;
  /** Anchor target, and what a section's `aria-labelledby` points at. */
  id?: string;
}

/**
 * Heading that reveals line by line as it scrolls in.
 *
 * `overflow` clips each line to its line-height box, which is why the container
 * keeps `leading-display` (1.1) as its floor — see obsidian/frontend/text-engine.md.
 * `justify-*` is what actually aligns the words: the engine's container is flex.
 */
export const RevealHeading = ({
  children,
  tag,
  className = "",
  align = "left",
  delayIn = 0,
  id,
}: RevealHeadingProps) => (
  <TextEngine
    id={id}
    tag={tag}
    mode="once"
    className={`leading-display ${
      align === "center" ? "text-center justify-center" : "text-left justify-start"
    } ${className}`}
    lineIn={{ y: "0%", opacity: 1 }}
    lineOut={{ y: "110%", opacity: 0 }}
    lineStagger={90}
    lineConfig={{ duration: 950, easing: easings.easeOutQuint }}
    delayIn={delayIn}
    overflow
  >
    {children}
  </TextEngine>
);
