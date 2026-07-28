// 📖 Docs: obsidian/frontend/components/ui.md
"use client";

import { track } from "@/lib/analytics/client";

import { WhatsAppGlyph } from "./whatsapp-glyph";

export interface WhatsAppButtonProps {
  /** A `wa.me` link — build it with `whatsappProductHref`. */
  href: string;
  children: React.ReactNode;
  /** Credits the click to a piece in the admin's metrics. */
  productSlug?: string | null;
  className?: string;
}

/**
 * The buy action. Every route that sells a piece uses this one.
 *
 * WhatsApp green with the mark, not the site's rose: the label used to have to
 * say "falar no WhatsApp" because nothing else did, which made it two lines on
 * a phone and read as a sentence rather than a button. The colour and the mark
 * carry the destination, so the words are free to be short. It also matches the
 * floating button already on the page, so both obviously go to the same place.
 *
 * The label is `foreground`, not `action-whatsapp-foreground`. White on WhatsApp
 * green measures 1.98:1 — WhatsApp's own buttons look like that and it fails
 * WCAG AA for text by a wide margin. Ink on the same green is 9.22:1. The FAB
 * keeps the white mark because an icon trades on recognition and carries no
 * words; a button whose words must be read in daylight does not.
 *
 * A client leaf only because of the click measurement — the tracker uses
 * `sendBeacon`, so the event survives the browser handing over to WhatsApp
 * mid-navigation. Nothing here waits on it.
 */
export const WhatsAppButton = ({
  href,
  children,
  productSlug = null,
  className = "",
}: WhatsAppButtonProps) => (
  <a
    href={href}
    target="_blank"
    rel="noopener"
    onClick={() =>
      track("whatsapp", productSlug ? `/produto/${productSlug}` : "/", productSlug)
    }
    className={`inline-flex items-center justify-center gap-2.5 rounded-pill bg-action-whatsapp px-6 py-3.5 text-base font-medium text-foreground transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-action-whatsapp-hover ${className}`}
  >
    <WhatsAppGlyph className="size-5 shrink-0" />
    {children}
  </a>
);
