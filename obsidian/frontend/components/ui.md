---
tags: [frontend, stable]
updated: 2026-07-25
---

# Catalog — UI Primitives

Files in `src/components/ui/` — design-system primitives: stateless, no provider
dependencies, no feature knowledge. Conventions: [[component-conventions]].

## `<ButtonLink>` — `button-link.tsx`

A link that looks like a button. Server Component.

- `variant`: `"primary"` (brand rose) · `"outline"` (ink border) · `"inverse"`
  (for dark surfaces).
- External `href`s (`http…`) render a plain `<a target="_blank" rel="noopener">`;
  everything else goes through `next/link`.
- Hover is a token-backed CSS `transition-colors` — a colour change only, which
  is the ADR-0014 exception, not a spring.

> A button that *does* something on the page is a `<button>`, not this. See
> [[html-semantics]].

## `<Eyebrow>` — `eyebrow.tsx`

Small tracked label that opens a section, prefixed by a decorative brand dot
(`aria-hidden`). `tone="inverse"` for dark surfaces.

## `<RevealHeading>` — `reveal-heading.tsx`

Heading that reveals line by line on scroll-in. `"use client"`.

Wraps [[text-engine]] with the two rules that bite every TextEngine block already
applied: `leading-display` on the container (≥ 1.1, because `overflow` clips to
the line-height box) and `justify-*` paired with `text-*` (the container is
flex, so `text-align` alone does nothing).

- `tag` — `"h1" | "h2" | "h3"`. The tag carries the meaning; `className` carries
  the size.
- `id` — anchor target, and what a section's `aria-labelledby` points at.
- `align`, `delayIn`.

## `<RevealText>` — `reveal-text.tsx`

Body copy that fades up word by word. `"use client"`. No `overflow`, so tight
leading is safe here.

## `<ProductGallery>` — `product-gallery.tsx`

Big frame plus a thumbnail strip. `"use client"`. The strip is a horizontal
scroller, so it degrades into a natural swipe on a phone — no carousel library,
no drag handlers, and it stays keyboard-operable.

## `<ProductDetails>` — `product-details.tsx`

Name, price, instalments, description, size grade and colourways. A Server
Component. `tag` picks the heading level: `h2` inside the dialog, `h1` on the
product page.

> Both are shared by the home dialog and `/produto/<slug>` on purpose — two
> copies would eventually describe the same piece differently. See
> [[admin-area]] and [[decisions-log]] ADR-0024.

## `<WhatsAppFab>` — `whatsapp-fab.tsx`

Floating WhatsApp button, bottom-right on every public page. `"use client"`.

The halo pulses on the **app-wide ticker** (`useLoop`), not a CSS animation:
`@keyframes` are banned here and a spring cannot express a loop. The callback
writes `transform` and `opacity` on a ref, so it never re-renders React, and it
is skipped entirely under `prefers-reduced-motion`.

It returns `null` while the cookie banner is up — both live bottom-right, and a
button behind a banner is worse than no button. It is mounted by the three
public views, never by the admin.

WhatsApp's green is a third party's brand colour, so it is a Tier-1 primitive
(`--raw-color-whatsapp`) with its own action role — not a hex in a class.

## Related

[[component-conventions]] · [[components/animation-springs]] · [[text-engine]] ·
[[design-system]]
