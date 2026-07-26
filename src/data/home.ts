/**
 * Static content for the home view — everything except the catalogue.
 *
 * Copy, links, opening hours and the section imagery live here and reach the
 * sections as props. **Products do not**: they are owned by the admin area and
 * come from the catalogue store (`lib/catalog`), so editing a price is a job
 * for `/admin`, not for this file.
 */

import { siteConfig } from "@/lib/site";

export interface NavLink {
  label: string;
  href: string;
}

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  image: string;
}

export interface Review {
  quote: string;
  author: string;
}

export interface StoreInfo {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  hours: { days: string; time: string }[];
  phoneLabel: string;
  phoneHref: string;
  whatsappHref: string;
  mapsHref: string;
  instagramHref: string;
  instagramLabel: string;
  vipGroupHref: string;
  reviewsHref: string;
}

/** The copy that opens a section: label, heading, and an optional line under it. */
export interface SectionCopy {
  eyebrow: string;
  title: string;
  text?: string;
}

export interface HomeContent {
  nav: NavLink[];
  /** Headings the shop can rewrite from the admin. */
  sections: {
    categories: SectionCopy;
    products: SectionCopy & { ctaLabel: string };
    prices: SectionCopy & { note: string; ctaLabel: string };
    reviews: SectionCopy & { linkLabel: string };
    visit: SectionCopy & { mapsLabel: string; whatsappLabel: string };
  };
  hero: {
    eyebrow: string;
    title: string[];
    description: string;
    primaryCta: NavLink;
    secondaryCta: NavLink;
    image: { src: string; alt: string };
    stats: { value: string; label: string }[];
  };
  marquee: string[];
  categories: Category[];
  vip: {
    eyebrow: string;
    title: string;
    description: string;
    cta: NavLink;
  };
  reviews: {
    rating: string;
    count: string;
    items: Review[];
  };
  store: StoreInfo;
}

/**
 * WhatsApp deep link, pre-filled for a specific piece.
 *
 * The message carries the **link to the product page**, not just the name.
 * `wa.me` cannot attach an image, but WhatsApp previews the URL — and that page
 * declares the photo as its `og:image`, so the shop sees the piece in the chat
 * instead of guessing from a name that repeats across listings.
 */
export const whatsappProductHref = (product: {
  name: string;
  slug: string;
  price: number;
}) => {
  const url = `${siteConfig.url}/produto/${product.slug}`;
  const price = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(product.price);

  return `https://wa.me/5545988255705?text=${encodeURIComponent(
    `Olá! Vi no site e queria saber mais sobre:\n\n${product.name} — ${price}\n${url}`,
  )}`;
};

export const homeContent: HomeContent = {
  // Absolute, not bare fragments: the header also renders on the product
  // pages, where "#novidades" would point at nothing on that document.
  nav: [
    { label: "Categorias", href: "/#categorias" },
    { label: "Novidades", href: "/#novidades" },
    { label: "Preços", href: "/#precos" },
    { label: "Avaliações", href: "/#avaliacoes" },
    { label: "A loja", href: "/#visite" },
  ],

  sections: {
    categories: {
      eyebrow: "Encontre seu estilo",
      title: "Escolha por onde começar.",
      text: "Toque numa seção e a vitrine abaixo mostra só as peças dela.",
    },
    products: {
      eyebrow: "Chegou agora",
      title: "As peças que estão saindo da loja.",
      ctaLabel: "Ver tudo no WhatsApp",
    },
    prices: {
      eyebrow: "Quanto custa",
      title: "Preço de loja de bairro, peça de vitrine.",
      text: "Cada seção começa num valor — e a etiqueta é a mesma que você vê aqui. Toque numa linha para ver as peças dela.",
      note: "Tudo pode ser parcelado em até 3x sem juros. Quer saber de uma peça específica? Chama no WhatsApp que a gente responde na hora.",
      ctaLabel: "Tirar dúvida no WhatsApp",
    },
    reviews: {
      eyebrow: "Avaliações reais",
      title: "O que dizem sobre a Renova.",
      linkLabel: "Ver todas as avaliações no Google",
    },
    visit: {
      eyebrow: "Visite nossa loja",
      title: "Estamos no centro de Santa Helena.",
      mapsLabel: "Ver no Google Maps",
      whatsappLabel: "Falar no WhatsApp",
    },
  },

  hero: {
    eyebrow: "Santa Helena · Paraná",
    title: ["Roupa nova", "toda semana."],
    description:
      "Feminino, masculino, infantil e tênis escolhidos peça a peça. Você prova, leva na hora e parcela em até 3x sem juros.",
    primaryCta: {
      label: "Falar no WhatsApp",
      href: "https://wa.me/5545988255705?text=Ol%C3%A1!%20Vim%20pelo%20site.",
    },
    secondaryCta: { label: "Ver as novidades", href: "/#novidades" },
    image: {
      src: "/assets/hero/loja.webp",
      alt: "Sacolas de compras da Renova Closet",
    },
    stats: [
      { value: "4", label: "seções na loja" },
      { value: "3x", label: "sem juros" },
      { value: "5,0", label: "no Google" },
    ],
  },

  marquee: [
    "Parcele em até 3x sem juros",
    "Novidades toda semana",
    "Provou, levou",
    "Atendimento de verdade",
  ],

  categories: [
    {
      slug: "feminino",
      name: "Feminino",
      tagline: "Do básico ao conjunto de treino",
      image: "/assets/categorias/feminino.jpg",
    },
    {
      slug: "masculino",
      name: "Masculino",
      tagline: "Peças que resolvem o dia inteiro",
      image: "/assets/categorias/masculino.jpg",
    },
    {
      slug: "infantil",
      name: "Infantil",
      tagline: "Confortável para brincar",
      image: "/assets/categorias/infantil.jpg",
    },
    {
      slug: "tenis",
      name: "Tênis",
      tagline: "Modelos que saem rápido",
      image: "/assets/categorias/tenis.jpg",
    },
  ],


  vip: {
    eyebrow: "Grupo VIP · WhatsApp",
    title: "As novidades chegam primeiro para quem está no VIP",
    description:
      "Peças novas em primeira mão, promoções exclusivas e nada de spam — só o que interessa.",
    cta: {
      label: "Entrar no grupo",
      href: "https://chat.whatsapp.com/BdJJvnbHoKtHT03385mDG8?s=sh&p=i&mlu=0&ilr=0&amv=2",
    },
  },

  reviews: {
    rating: "5,0",
    count: "10 avaliações no Google",
    items: [
      {
        quote:
          "Atendimento maravilhoso e peças lindas! Saí com várias novidades e me apaixonei pela curadoria da loja.",
        author: "Cliente Renova",
      },
      {
        quote:
          "Amei tudo! A loja é um charme e as meninas atendem super bem. Recomendo demais!",
        author: "Cliente Renova",
      },
      {
        quote:
          "Lugar aconchegante, roupas de qualidade e preço justo. Virei cliente fiel da Renova Closet.",
        author: "Cliente Renova",
      },
    ],
  },

  store: {
    street: "R. Getúlio Vargas",
    city: "Santa Helena",
    state: "PR",
    postalCode: "85892-000",
    hours: [
      { days: "Segunda a sexta", time: "9h às 19h, sem fechar para o almoço" },
      { days: "Sábado", time: "9h às 16h, sem fechar para o almoço" },
    ],
    phoneLabel: "(45) 98825-5705",
    phoneHref: "tel:+5545988255705",
    whatsappHref:
      "https://wa.me/5545988255705?text=Ol%C3%A1!%20Vim%20pelo%20site.",
    mapsHref: "https://maps.app.goo.gl/ww3wHFERmMwLaHxk8",
    instagramHref: "https://instagram.com/ren_ovacloset",
    instagramLabel: "@ren_ovacloset",
    vipGroupHref:
      "https://chat.whatsapp.com/BdJJvnbHoKtHT03385mDG8?s=sh&p=i&mlu=0&ilr=0&amv=2",
    reviewsHref: "https://www.google.com/search?q=renova+closet+santa+helena",
  },
};
