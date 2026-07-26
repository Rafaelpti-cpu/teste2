// 📖 Docs: obsidian/frontend/components/ui.md
"use client";

import { easings } from "@react-spring/web";
import TextEngine from "spring-text-engine";

import type { RevealAlign } from "./reveal-heading";

export interface RevealTextProps {
  children: React.ReactNode;
  className?: string;
  align?: RevealAlign;
  delayIn?: number;
}

/**
 * Body copy that fades up word by word. No `overflow` here — the words move a
 * few pixels rather than sliding out of a clip box, so tight leading is safe.
 */
export const RevealText = ({
  children,
  className = "",
  align = "left",
  delayIn = 0,
}: RevealTextProps) => (
  <TextEngine
    tag="p"
    mode="once"
    className={`${
      align === "center" ? "text-center justify-center" : "text-left justify-start"
    } ${className}`}
    wordIn={{ y: 0, opacity: 1 }}
    wordOut={{ y: 18, opacity: 0 }}
    wordStagger={26}
    wordConfig={{ duration: 700, easing: easings.easeOutQuart }}
    delayIn={delayIn}
  >
    {children}
  </TextEngine>
);
