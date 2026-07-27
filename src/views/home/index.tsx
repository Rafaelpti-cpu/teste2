/**
 * Home view — route `/`.
 *
 * A Server Component: every section below is either server-rendered or a thin
 * client leaf. Content comes from `data/home.ts` and is passed down as props,
 * so no section reaches for it directly.
 *
 * `isBot()` reads request headers, which opts this route out of static
 * prerendering. That is the deliberate cost of never shipping the 3D bundle to
 * a crawler — see obsidian/meta/decisions-log.md ADR-0020.
 */
import { getCatalogStore } from "@/lib/catalog";
import { readSiteContent } from "@/lib/content";
import { isBot } from "@/utils/is-bot";
import { getStoreStructuredData } from "@/utils/seo/structured-data";

import { Categories } from "./sections/categories";
import { Hero } from "./sections/hero";
import { Marquee } from "./sections/marquee";
import { Prices } from "./sections/prices";
import { Products } from "./sections/products";
import { Reviews } from "./sections/reviews";
import { WhatsAppFab } from "@/components/ui/whatsapp-fab";

import { SiteFooter } from "./sections/site-footer";
import { SiteHeader } from "./sections/site-header";
import { VipBand } from "./sections/vip-band";
import { Visit } from "./sections/visit";

export const HomeView = async () => {
  const [withScene, catalogue, content] = await Promise.all([
    isBot().then((bot) => !bot),
    getCatalogStore().list(),
    readSiteContent(),
  ]);
  // Hidden pieces stay in the admin but never reach a customer.
  const products = catalogue.filter((product) => product.active);
  const { nav, sections, hero, marquee, categories, vip, reviews, store } = content;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getStoreStructuredData(store)),
        }}
      />

      <SiteHeader nav={nav} whatsappHref={store.whatsappHref} />

      <main id="main">
        <Hero content={hero} withScene={withScene} />
        <Marquee items={marquee} />
        <Categories copy={sections.categories} categories={categories} products={products} />
        <Products copy={sections.products} products={products} allHref={store.whatsappHref} />
        <Prices
          copy={sections.prices}
          products={products}
          ctaHref={store.whatsappHref}
        />
        <VipBand content={vip} />
        <Reviews copy={sections.reviews} content={reviews} reviewsHref={store.reviewsHref} />
        <Visit copy={sections.visit} store={store} />
      </main>

      <SiteFooter nav={nav} store={store} />

      <WhatsAppFab href={store.whatsappHref} />
    </>
  );
};
