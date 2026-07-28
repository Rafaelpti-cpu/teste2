/**
 * The browser half of analytics: mints a visitor id and posts events.
 *
 * The id lives in `sessionStorage`, which the browser throws away when the tab
 * closes. That is the whole privacy design — it separates "looked at four
 * pieces" from "four people looked at one piece" and identifies nobody, so it
 * needs no cookie, no consent banner and no personal data. Do not move it to
 * `localStorage` to get "returning visitors": that turns an anonymous counter
 * into tracking, and the privacy policy would have to change with it.
 *
 * 📖 Docs: obsidian/backend/analytics.md
 */

import type { SiteEventType } from "@/types/analytics";

const KEY = "renova.visitor";

const visitorId = (): string | null => {
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    sessionStorage.setItem(KEY, fresh);
    return fresh;
  } catch {
    // Private mode, storage disabled, embedded browser — measure nothing.
    return null;
  }
};

/**
 * Records an event. Never throws and never blocks: a failure to measure is not
 * a failure the customer should ever notice.
 */
export const track = (
  type: SiteEventType,
  path: string,
  productSlug?: string | null,
): void => {
  const visitor = visitorId();
  if (!visitor) return;

  const body = JSON.stringify({ type, path, productSlug: productSlug ?? null, visitor });

  // `sendBeacon` survives the page being closed — which is exactly what happens
  // when the WhatsApp click hands the customer over to another app.
  try {
    if (navigator.sendBeacon?.("/api/eventos", new Blob([body], { type: "application/json" }))) {
      return;
    }
  } catch {
    // Falls through to fetch.
  }

  void fetch("/api/eventos", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
};
