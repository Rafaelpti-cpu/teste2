import type { Metadata } from "next";

import { getCatalogStore } from "@/lib/catalog";
import { coverImage } from "@/types/catalog";
import { formatPrice } from "@/utils/format";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";
import { ProductView } from "@/views/produto";

type Params = { params: Promise<{ slug: string }> };

/**
 * The `og:image` here is the whole point of the route: WhatsApp cannot receive
 * an attachment through a `wa.me` link, but it previews the URL — so the shop
 * sees the photo of the piece the customer is asking about.
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const products = await getCatalogStore().list();
  const product = products.find((item) => item.slug === slug && item.active);

  if (!product) {
    return buildMetadata({ title: "Peça não encontrada · Renova Closet" });
  }

  return buildMetadata({
    title: `${product.name} — ${formatPrice(product.price)} · Renova Closet`,
    description:
      product.description ||
      `${product.name} por ${formatPrice(product.price)} na Renova Closet, em Santa Helena. Parcele em até 3x sem juros.`,
    url: `/produto/${product.slug}`,
    ogImage: coverImage(product),
    // The catalogue import writes every photo at 900×1200.
    ogImageWidth: 900,
    ogImageHeight: 1200,
  });
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  return <ProductView slug={slug} />;
}
