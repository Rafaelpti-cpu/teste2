import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

/**
 * Generates `/robots.txt`. Allows all crawlers and points them at the sitemap.
 * Tighten the rules per environment (e.g. disallow `/` on staging).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The admin has nothing for a crawler and should never appear in
      // results. The area also sends `noindex` itself — see app/admin/layout.tsx.
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
