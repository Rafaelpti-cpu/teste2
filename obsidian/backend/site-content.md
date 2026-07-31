---
tags: [backend, admin, stable]
updated: 2026-07-26
---

# Site Content

Everything written on the public pages that is **not** a product: headings,
section labels, the hero, the marquee, the VIP band, the reviews, the store
details. Edited from **/admin/textos**.

A single JSON document, not a collection — read it, write it whole. It picks its
backing the same way the catalogue does ([[catalog-store]]): Supabase when
configured (`site_content` table, one row), a local `.data/content.json`
otherwise. ADR: [[decisions-log]] ADR-0025.

## Files

| File | Role |
|------|------|
| `src/data/home.ts` | The **defaults** — the copy the site ships with |
| `src/lib/content/schema.ts` | zod schema, shared by the route and the store |
| `src/lib/content/index.ts` | `readSiteContent` / `writeSiteContent`, both backings |
| `src/app/api/admin/content/route.ts` | GET, PUT (whole document) |
| `src/views/admin/content-view.tsx` | The admin page |
| `src/views/admin/content-form.tsx` | The form, grouped by area of the site |

## Saved documents are merged over the defaults

`withDefaults()` spreads the stored document over `homeContent` **before**
validating. Without that, adding a field to the schema would break every site
that had already saved its copy: the stored document simply would not have the
new key, and a required field would fail validation. New copy therefore shows
its default until the shop edits it.

The same function is why an invalid stored document degrades to the defaults
with a server-side log instead of taking the site down.

## `readSiteContent()` never throws — and once did

Its doc comment claimed "falls back to the defaults, never throws for the site"
while the code did the opposite: `supabaseRest` threw on any non-2xx and nothing
caught it. One transient failure reading `site_content` therefore took the whole
home page to the error screen. That was the "sometimes it breaks, a refresh
fixes it" the shop reported, and it survived two wrong diagnoses — a stale
client chunk, and the catalogue read — because the comment said this path was
already safe and I believed it.

It is now true: the read is wrapped, logs, and returns `homeContent`.

> [!important] Degrade here, fail loudly for the catalogue
> These are headings and paragraphs, and the defaults are a complete set of
> them — a visitor cannot tell the shop had edited a subtitle. An empty product
> grid is the opposite: it says "this shop has nothing", which is worse than
> admitting something broke. So the copy read falls back and the products read
> still errors, with retries, in [[catalog-store]].

Reads here get three attempts with backoff, same as the catalogue. Writes get
one — retrying a `PUT` of the whole document is safe, but there is no reason to
hide a failing save from the person who pressed the button.

## What is deliberately not editable

- **Category names** — `categories[].name` matches a catalogue category and the
  card filters the grid by it. Renaming "Feminino" here would silently empty
  that card. Only the tagline is exposed in the form.
- **Image paths** — the hero image and the category images are assets, not copy.
- **Product text** — that lives on the product, in the Produtos tab.
- **The numbers in the price section** — they are read off the catalogue
  (`views/home/sections/prices.tsx`). Only the wording around them is copy;
  exposing the figures would let the site contradict its own product cards.

## Related

[[admin-area]] · [[catalog-store]] · [[api-architecture]]
