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

/**
 * The catalogue, or nothing — but never an exception.
 *
 * The read already retries three times ([[catalog-store]]). When even that
 * fails, the page used to throw and the customer got the error screen: no
 * shop name, no address, no WhatsApp, nothing to do but leave.
 *
 * I argued the opposite of this once — that an empty grid says "this shop has
 * nothing" and is worse than admitting a fault. That was wrong, because an
 * empty grid is not the only alternative. The sections below say plainly that
 * the pieces are not loading and point at WhatsApp, which is where the sale
 * happens anyway. The shop stays reachable; only the grid is missing.
 */
const readCatalogue = async () => {
  try {
    return { products: await getCatalogStore().list(), failed: false };
  } catch (error) {
    console.error("[home] catálogo indisponível, servindo o site sem ele:", error);
    return { products: [], failed: true };
  }
};

export const HomeView = async () => {
  const [withScene, catalogue, content] = await Promise.all([
    isBot().then((bot) => !bot),
    readCatalogue(),
    readSiteContent(),
  ]);
  // Hidden pieces stay in the admin but never reach a customer.
  const products = catalogue.products.filter((product) => product.active);
  const catalogueDown = catalogue.failed;
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

        {catalogueDown ? (
          /*
            Said out loud, in the grid's place. A silent empty section would
            read as "the shop has nothing"; this reads as "come back in a
            minute, or just message us" — and the WhatsApp link is the same one
            the piece would have led to.
          */
          <section
            aria-labelledby="catalogo-indisponivel"
            className="container-page py-16 md:py-24"
          >
            <div className="flex max-w-[46ch] flex-col items-start gap-4">
              <h2
                id="catalogo-indisponivel"
                className="font-display text-3xl font-light text-foreground"
              >
                As peças não carregaram agora
              </h2>
              <p className="text-base text-foreground-muted">
                É coisa de instantes — atualize a página em um minuto. Se
                preferir, chame a gente no WhatsApp que mostramos as novidades
                por lá na hora.
              </p>
              <a
                href={store.whatsappHref}
                target="_blank"
                rel="noopener"
                className="rounded-pill bg-action-whatsapp px-6 py-3.5 text-base font-medium text-foreground transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-action-whatsapp-hover"
              >
                Ver as novidades no WhatsApp
              </a>
            </div>
          </section>
        ) : (
          <>
            <Categories
              copy={sections.categories}
              categories={categories}
              products={products}
            />
            <Products
              copy={sections.products}
              products={products}
              allHref={store.whatsappHref}
            />
            <Prices
              copy={sections.prices}
              products={products}
              ctaHref={store.whatsappHref}
            />
          </>
        )}
        <VipBand content={vip} />
        <Reviews copy={sections.reviews} content={reviews} reviewsHref={store.reviewsHref} />
        <Visit copy={sections.visit} store={store} />
      </main>

      <SiteFooter nav={nav} store={store} />

      <WhatsAppFab href={store.whatsappHref} />
    </>
  );
};
