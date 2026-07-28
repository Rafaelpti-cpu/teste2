// 📖 Docs: obsidian/backend/analytics.md
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { track } from "@/lib/analytics/client";

/** `/produto/vestido-linho` → `vestido-linho`; anything else → null. */
const productSlugOf = (pathname: string): string | null => {
  const match = /^\/produto\/([a-z0-9-]+)\/?$/.exec(pathname);
  return match ? match[1] : null;
};

/**
 * The shop's own trips through the admin are not traffic. Left in, they would
 * be the single busiest "visitor" on the site — and the person reading the
 * numbers is the person creating them.
 */
const isMeasured = (pathname: string) => !pathname.startsWith("/admin");

/**
 * Records one view per page the visitor lands on. Renders nothing.
 *
 * Mounted once in the root layout and reads the path itself, so a new route
 * is measured the day it is added without anyone remembering to wire it up.
 * Opening a piece in the dialog does not change the path — that view is
 * recorded by the dialog, which is the only place that knows it happened.
 *
 * The ref guard matters in development, where Strict Mode mounts effects twice
 * and would otherwise double every number in the admin: a bug shaped like
 * traffic, which is the worst kind to notice late.
 */
export const PageBeacon = () => {
  const pathname = usePathname();
  const counted = useRef<string | null>(null);

  useEffect(() => {
    if (counted.current === pathname) return;
    counted.current = pathname;
    if (!isMeasured(pathname)) return;
    track("view", pathname, productSlugOf(pathname));
  }, [pathname]);

  return null;
};
