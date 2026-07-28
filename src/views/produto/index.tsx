/**
 * Product view — route `/produto/[slug]`.
 *
 * The dialog on the home page is the fast path; this is the addressable one.
 * It exists so a piece can be shared, indexed, and — the reason it was built —
 * so the WhatsApp message carries a link that previews with the photo. `wa.me`
 * cannot attach an image; a URL with `og:image` is how the shop sees the piece.
 */
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { coverImage } from "@/types/catalog";
import { ProductDetails } from "@/components/ui/product-details";
import { ProductGallery } from "@/components/ui/product-gallery";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { whatsappProductHref } from "@/data/home";
import { readSiteContent } from "@/lib/content";
import { getCatalogStore } from "@/lib/catalog";
import { getProductStructuredData } from "@/utils/seo/structured-data";

import { WhatsAppFab } from "@/components/ui/whatsapp-fab";

import { SiteFooter } from "@/views/home/sections/site-footer";
import { SiteHeader } from "@/views/home/sections/site-header";

export interface ProductViewProps {
  slug: string;
}

export const ProductView = async ({ slug }: ProductViewProps) => {
  const products = await getCatalogStore().list();
  const product = products.find((item) => item.slug === slug && item.active);
  if (!product) notFound();

  const { nav, store } = await readSiteContent();
  const related = products.filter(
    (item) =>
      item.active && item.category === product.category && item.id !== product.id,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getProductStructuredData(product)),
        }}
      />

      <SiteHeader nav={nav} whatsappHref={store.whatsappHref} />

      <main id="main" className="container-page py-10 md:py-16">
        <nav aria-label="Breadcrumb" className="pb-8">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
            <li>
              <Link
                href="/"
                className="transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
              >
                Início
              </Link>
            </li>
            <li aria-hidden="true">·</li>
            <li>
              <Link
                href="/#novidades"
                className="transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
              >
                {product.category}
              </Link>
            </li>
            <li aria-hidden="true">·</li>
            <li aria-current="page" className="text-foreground">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 md:grid-cols-2 md:gap-14">
          <ProductGallery
            images={product.images}
            name={product.name}
            className="md:sticky md:top-24 md:self-start"
            priority
          />

          <div className="flex flex-col gap-7">
            <ProductDetails product={product} tag="h1" />

            <div className="flex flex-col items-start gap-3">
              <WhatsAppButton
                href={whatsappProductHref(product)}
                productSlug={product.slug}
              >
                Quero esta peça
              </WhatsAppButton>
              <p className="text-xs text-foreground-muted">
                A mensagem já vai com a foto e o nome da peça.
              </p>
            </div>

            <dl className="flex flex-col gap-3 border-t border-border-subtle pt-6 text-sm">
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-foreground-muted">Retire na loja:</dt>
                <dd className="text-foreground">
                  {store.street} — {store.city}, {store.state}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-foreground-muted">Pagamento:</dt>
                <dd className="text-foreground">Em até 3x sem juros</dd>
              </div>
            </dl>
          </div>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="relacionados" className="pt-16 md:pt-24">
            <h2
              id="relacionados"
              className="font-display text-2xl font-light text-foreground"
            >
              Mais em {product.category}
            </h2>
            <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {related.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/produto/${item.slug}`}
                    className="group flex flex-col gap-2"
                  >
                    <span className="relative block aspect-[3/4] overflow-hidden rounded-card bg-surface-muted">
                      <Image
                        src={coverImage(item)}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 14rem"
                        className="object-cover"
                      />
                    </span>
                    <span className="text-sm text-foreground">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <SiteFooter nav={nav} store={store} />

      <WhatsAppFab href={store.whatsappHref} />
    </>
  );
};
