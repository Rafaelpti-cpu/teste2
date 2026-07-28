import type { MetadataRoute } from "next";

import { getCatalogStore } from "@/lib/catalog";
import { siteConfig } from "@/lib/site";

/**
 * `/sitemap.xml` — the home route plus a page per visible product.
 *
 * Third attempt, so the history is worth keeping:
 *
 * 1. Plain `sitemap.ts`. Generated at build time, which on a fresh deploy runs
 *    *before* the catalogue exists — it shipped listing only the home page.
 * 2. `sitemap.ts` with `force-dynamic`. Correct in dev, 404 in production.
 * 3. A route handler at `app/sitemap.xml/route.ts`. Correct in dev *and* in a
 *    local production build (`next start`), 404 once deployed: Vercel resolves
 *    a path with a file extension against the static filesystem before it ever
 *    reaches the function.
 *
 * So: back to the metadata convention, which the platform special-cases, with
 * `revalidate` instead of `force-dynamic`. The page is regenerated in the
 * background at most once an hour. That is well inside what a crawler notices,
 * and a piece hidden in the admin drops out of the sitemap within the hour
 * rather than pointing at a 404.
 *
 * If this ever needs to be per-request, verify it **on a deployment**, not in
 * `next start` — that is exactly what hid the last two failures.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const home = {
    url: siteConfig.url,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 1,
  };

  // This runs during the build, so it reaches Supabase over the network from
  // Vercel's builder. A throw here does not degrade the sitemap — it fails the
  // whole deployment, taking the storefront down with it over a file that only
  // search crawlers read. Never worth it: on failure the sitemap lists the home
  // page and the next revalidation picks the catalogue back up.
  let products: Awaited<ReturnType<ReturnType<typeof getCatalogStore>["list"]>>;
  try {
    products = await getCatalogStore().list();
  } catch (error) {
    console.error("[sitemap] catalogue unavailable, listing home only:", error);
    return [home];
  }

  return [
    home,
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
