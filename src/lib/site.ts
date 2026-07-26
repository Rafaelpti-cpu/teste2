/**
 * Site-wide configuration — the single source of truth for SEO.
 *
 * Consumed by the metadata generator, `robots.ts`, `sitemap.ts`, and the
 * JSON-LD structured-data helper.
 */
import { publicEnv } from "@/env";

export const siteConfig = {
  name: "Renova Closet",
  description:
    "Moda feminina, masculina, infantil e tênis com curadoria em Santa Helena, PR. Novidades toda semana e parcelamento em até 3x sem juros.",
  /**
   * Public origin, no trailing slash. Drives canonical URLs, OG tags, the
   * sitemap, and JSON-LD. Set `NEXT_PUBLIC_SITE_URL` in production.
   */
  url: publicEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Default Open Graph / Twitter share image (path under `public/`). */
  ogImage: "/open-graph.png",
  twitterHandle: "@renovacloset",
  author: "Renova Closet",
  /** Browser theme-color (address bar / PWA) — the brand rose. */
  themeColor: "#f08c98",
} as const;
