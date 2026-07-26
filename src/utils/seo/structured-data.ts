/**
 * @fileoverview JSON-LD structured data helpers.
 *
 * Structured data lets search engines understand the site as entities
 * (Organization, WebSite) rather than just text — improving rich results.
 * Render the output inside a `<script type="application/ld+json">` tag.
 */

import type { StoreInfo } from "@/data/home";
import type { Product } from "@/types/catalog";
import { siteConfig } from "@/lib/site";

/**
 * Organization + WebSite schema for the site root. Emit once, in the root
 * layout. The two nodes are linked by `@id` so crawlers treat them as related.
 */
export function getSiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: `${siteConfig.url}/android-icon-192x192.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        name: siteConfig.name,
        description: siteConfig.description,
        url: siteConfig.url,
        publisher: { "@id": `${siteConfig.url}/#organization` },
      },
    ],
  };
}

/**
 * `Product` schema for a product page — what earns the price and availability
 * chip in search results.
 *
 * `availability` is always `InStock`: the catalogue has no stock state, and
 * claiming otherwise would be a guess. Revisit if the admin ever tracks it.
 */
export function getProductStructuredData(product: Product) {
  const url = `${siteConfig.url}/produto/${product.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description:
      product.description ||
      `${product.name} na Renova Closet, em Santa Helena, PR.`,
    image: product.images.map((image) => `${siteConfig.url}${image}`),
    category: product.category,
    ...(product.colors.length > 0 && {
      color: product.colors.map((color) => color.name),
    }),
    ...(product.sizes.length > 0 && { size: product.sizes }),
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "BRL",
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
      seller: { "@id": `${siteConfig.url}/#store` },
    },
  };
}

/** `Seg a sex, 9h às 19h` → the schema.org day tokens the spec expects. */
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/**
 * ClothingStore schema for the home page — the node that earns the map card,
 * opening hours and click-to-call in local results.
 *
 * Customer ratings are deliberately **not** emitted: self-serving review markup
 * on a business's own page is against Google's structured-data guidelines. The
 * quotes stay visible content only.
 */
export function getStoreStructuredData(store: StoreInfo) {
  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "@id": `${siteConfig.url}/#store`,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    image: `${siteConfig.url}/assets/hero/loja.webp`,
    logo: `${siteConfig.url}/assets/brand/renova-lockup.png`,
    telephone: store.phoneHref.replace("tel:", ""),
    priceRange: "$$",
    currenciesAccepted: "BRL",
    address: {
      "@type": "PostalAddress",
      streetAddress: store.street,
      addressLocality: store.city,
      addressRegion: store.state,
      postalCode: store.postalCode,
      addressCountry: "BR",
    },
    sameAs: [store.instagramHref, store.mapsHref],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: WEEKDAYS,
        opens: "09:00",
        closes: "19:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday"],
        opens: "09:00",
        closes: "16:00",
      },
    ],
  };
}
