import type { MetadataRoute } from "next";

import { getCatalogStore } from "@/lib/catalog";
import { siteConfig } from "@/lib/site";

/**
 * Generates `/sitemap.xml` — the home route plus a page per visible product.
 *
 * Reads the catalogue, so a piece hidden in the admin drops out of the sitemap
 * on the next crawl instead of pointing at a 404.
 */
/**
 * Rendered per request, not at build time: on a fresh deploy the catalogue is
 * seeded by the first page view, which happens *after* the build — a static
 * sitemap would ship listing nothing but the home page.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getCatalogStore().list();

  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...products
      .filter((product) => product.active)
      .map((product) => ({
        url: `${siteConfig.url}/produto/${product.slug}`,
        lastModified: new Date(product.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
  ];
}
