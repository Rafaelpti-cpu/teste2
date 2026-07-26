/**
 * Validation for the site's copy.
 *
 * Shared by the API route (untrusted request bodies) and the store (a
 * hand-edited JSON file is untrusted too). Every field is required: this is a
 * whole-document save, so a missing key means the form is broken, not that the
 * shop wants an empty heading.
 */

import { z } from "zod";

const link = z.object({
  label: z.string().trim().min(1, "O texto do link é obrigatório.").max(60),
  href: z.string().trim().min(1, "O endereço é obrigatório.").max(500),
});

const sectionCopy = z.object({
  eyebrow: z.string().trim().max(60),
  title: z.string().trim().min(1, "O título é obrigatório.").max(160),
});

export const siteContentSchema = z.object({
  nav: z.array(link).max(8),

  sections: z.object({
    categories: sectionCopy.extend({ text: z.string().trim().max(300) }),
    products: sectionCopy.extend({ ctaLabel: z.string().trim().min(1).max(60) }),
    prices: sectionCopy.extend({
      text: z.string().trim().max(300),
      note: z.string().trim().max(400),
      ctaLabel: z.string().trim().min(1).max(60),
    }),
    reviews: sectionCopy.extend({ linkLabel: z.string().trim().min(1).max(80) }),
    visit: sectionCopy.extend({
      mapsLabel: z.string().trim().min(1).max(60),
      whatsappLabel: z.string().trim().min(1).max(60),
    }),
  }),

  hero: z.object({
    eyebrow: z.string().trim().max(60),
    /** Two lines in the design; the engine reflows them anyway. */
    title: z.array(z.string().trim().max(80)).min(1).max(3),
    description: z.string().trim().max(600),
    primaryCta: link,
    secondaryCta: link,
    image: z.object({
      src: z.string().trim().min(1),
      alt: z.string().trim().max(200),
    }),
    stats: z
      .array(
        z.object({
          value: z.string().trim().min(1).max(12),
          label: z.string().trim().min(1).max(40),
        }),
      )
      .max(4),
  }),

  marquee: z.array(z.string().trim().min(1).max(60)).max(8),

  categories: z
    .array(
      z.object({
        slug: z.string().trim().min(1).max(40),
        /** Must match a catalogue category — the card filters the grid by it. */
        name: z.string().trim().min(1).max(40),
        tagline: z.string().trim().max(80),
        image: z.string().trim().min(1),
      }),
    )
    .max(8),

  vip: z.object({
    eyebrow: z.string().trim().max(60),
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(400),
    cta: link,
  }),

  reviews: z.object({
    rating: z.string().trim().max(8),
    count: z.string().trim().max(60),
    items: z
      .array(
        z.object({
          quote: z.string().trim().min(1).max(600),
          author: z.string().trim().min(1).max(60),
        }),
      )
      .max(12),
  }),

  store: z.object({
    street: z.string().trim().min(1).max(120),
    city: z.string().trim().min(1).max(60),
    state: z.string().trim().min(1).max(4),
    postalCode: z.string().trim().max(12),
    hours: z
      .array(
        z.object({
          days: z.string().trim().min(1).max(60),
          time: z.string().trim().min(1).max(120),
        }),
      )
      .max(8),
    phoneLabel: z.string().trim().min(1).max(40),
    phoneHref: z.string().trim().min(1).max(60),
    whatsappHref: z.string().trim().min(1).max(500),
    mapsHref: z.string().trim().min(1).max(500),
    instagramHref: z.string().trim().min(1).max(300),
    instagramLabel: z.string().trim().min(1).max(60),
    vipGroupHref: z.string().trim().min(1).max(500),
    reviewsHref: z.string().trim().min(1).max(500),
  }),
});

export type SiteContentPayload = z.infer<typeof siteContentSchema>;
