import { getCatalogStore } from "@/lib/catalog";
import { siteConfig } from "@/lib/site";

/**
 * `/sitemap.xml` — the home route plus a page per visible product.
 *
 * A **route handler**, not Next's `sitemap.ts` metadata file. That file is
 * generated at build time, which on a fresh deploy runs *before* the catalogue
 * exists — it would ship listing only the home page. Marking it
 * `force-dynamic` fixed that in dev and then 404'd in production, so this is
 * the version that actually survives a deploy.
 *
 * Reading the store per request also means a piece hidden in the admin drops
 * out of the sitemap on the next crawl instead of pointing at a 404.
 */

export const dynamic = "force-dynamic";

/** XML has five reserved characters; slugs are tame but the escape is cheap. */
const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET() {
  const products = await getCatalogStore().list();
  const now = new Date().toISOString();

  const entries = [
    { loc: siteConfig.url, lastmod: now, priority: "1.0" },
    ...products
      .filter((product) => product.active)
      .map((product) => ({
        loc: `${siteConfig.url}/produto/${product.slug}`,
        lastmod: new Date(product.updatedAt).toISOString(),
        priority: "0.8",
      })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${escape(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
