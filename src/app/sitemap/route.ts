import { getCatalogStore } from "@/lib/catalog";
import { siteConfig } from "@/lib/site";

/**
 * The sitemap, served from `/sitemap` — **no `.xml`**.
 *
 * Fifth attempt. `/sitemap.xml` has now 404'd on the deployment through four
 * implementations (static metadata, `force-dynamic` metadata, a route handler
 * at `app/sitemap.xml/`, and `revalidate` metadata) while working in dev and in
 * `next start` every single time, on both the custom domain and the
 * `.vercel.app` one. `/robots.txt` from the same convention answers 200, so it
 * is something specific to that one path that I never identified.
 *
 * A sitemap does not need to live at `/sitemap.xml` or end in `.xml`. What it
 * needs is to return XML and to be discoverable — `robots.ts` points here, and
 * the address can be submitted to Search Console directly. Paths without an
 * extension are the shape every working route in this project uses.
 *
 * If `/sitemap.xml` ever starts working, this can move back. Until then, a
 * sitemap that is served beats a conventional address that is not.
 *
 * 📖 Docs: obsidian/frontend/seo-metadata.md
 */

export const revalidate = 3600;

/** XML has five reserved characters; slugs are tame but escaping is cheap. */
const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET() {
  const entries = [
    { loc: siteConfig.url, lastmod: new Date().toISOString(), priority: "1.0" },
  ];

  // A sitemap must never be the reason a deploy fails; on a bad read it lists
  // the home page and the next revalidation picks the catalogue back up.
  try {
    const products = await getCatalogStore().list();
    for (const product of products) {
      if (!product.active) continue;
      entries.push({
        loc: `${siteConfig.url}/produto/${product.slug}`,
        lastmod: new Date(product.updatedAt).toISOString(),
        priority: "0.8",
      });
    }
  } catch (error) {
    console.error("[sitemap] catálogo indisponível, listando só a home:", error);
  }

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
