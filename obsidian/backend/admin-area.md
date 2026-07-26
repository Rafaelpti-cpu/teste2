---
tags: [backend, admin, stable]
updated: 2026-07-26
---

# Admin Area

The shop's own screen for the catalogue, at `/admin`. Add, edit, hide and delete
products, with description, price, category, photo, **available sizes** and
**available colours**.

## Routes

| Route | View | Notes |
|-------|------|-------|
| `/admin` | `views/admin/products-view.tsx` | The catalogue as a list |
| `/admin/produtos/novo` | `views/admin/product-form-view.tsx` | Create |
| `/admin/produtos/[id]` | same view, with `id` | Edit |
| `/admin/entrar` | `views/admin/login-view.tsx` | Only reachable when locked |

Endpoints live under `app/api/admin/` — `products` (GET, POST),
`products/[id]` (GET, PATCH, DELETE), `upload` (POST, multipart) and `session`
(POST, DELETE). All follow the `{ data }` / `{ error }` envelope via `handle()`.

## Getting there

The site footer carries an "Área administrativa" link — the shop reaches it from
their own phone without typing a URL. It is discreet, not hidden: `/admin` is
`noindex` and disallowed in `robots.txt`, so a visible link costs nothing.

## Built for a phone

This is where the shop adds pieces, and they do it from a phone. That drives the
layout, not desktop convenience:

- **Photos** — a full-width "Adicionar fotos" button and a separate "Tirar foto"
  that opens the camera directly (`capture="environment"`). The file inputs
  themselves are `sr-only`: a bare `<input type="file">` is a ~30 px tap target.
  Uploads report progress ("Enviando 2/5…") and a failure names the photo that
  failed instead of losing the batch.
- **Tap targets** are ~44 px tall throughout — the row actions, the size chips,
  the colour rows.
- **The save bar is sticky.** The form is long; scrolling back to the bottom
  after every edit is the friction that stops a catalogue from being kept
  current.
- **Rows stack** below `sm`: thumbnail and name on one line, actions wrapping
  underneath, instead of five controls squeezed into a row.
- **Search and category chips** sit above the list. Forty pieces is a lot of
  scrolling on a phone; search ignores case *and* accents, so "tenis" finds
  "Tênis".

Verified at 375 × 812: no horizontal overflow on the list or the form.

## Access

Off by default, at the shop's request, while the site is unpublished. Set
`ADMIN_PASSWORD` and the whole area locks — pages redirect to `/admin/entrar`,
endpoints answer 401.

The session is a **signed cookie, not a session store**: an HMAC of a fixed
subject keyed by the password. It verifies with no database, and changing the
password invalidates every cookie. HttpOnly, SameSite=Lax, Secure in production,
30 days. Login attempts are throttled per IP, 8 per minute, in process.

> [!warning] The guard is not in the layout
> `app/admin/layout.tsx` also wraps `/admin/entrar`, so redirecting from it
> would loop forever. Protected **views** call `requireAdmin()` themselves. A
> new admin page must call it too — the layout will not do it for you.

While unlocked, `<AdminShell>` shows a standing warning, `robots.ts` disallows
`/admin`, and the layout sends `noindex, nofollow`.

## Sizes and colours

- **Sizes** are an ordered list of free-form strings, with one-tap runs from
  `SIZE_PRESETS` (`types/catalog.ts`). Order is preserved — the shop decides how
  the grade reads.
- **Colours** are `{ name, hex }`. Both halves earn their place: the swatch
  cannot say "off-white" versus "cream", and the name cannot be rendered as a
  dot on a product card.

## Photos

A product holds a **gallery** — `images: string[]`, validated non-empty. Order
carries meaning: `coverImage()` is the first entry and `hoverImage()` the
second, which the product card fades to on hover. The admin picker uploads
several files in one go, reorders with ← →, and shows which one is the cover.

`POST /api/admin/upload` takes multipart (not base64 JSON — that would be a
third larger and held in memory twice), accepts JPG/PNG/WebP/AVIF/GIF up to
8 MB, and hands the bytes to the active store, which decides where they land.
It uploads **one file per request**; the picker simply calls it in a loop, so a
failure loses one photo and not the batch.

> [!warning] Photo filenames must not collide with another product's slug
> The import wrote `<slug>.webp`, `<slug>-2.webp`… and `body-costa-nua-2.webp`
> is both "the second photo of body-costa-nua" and "the cover of
> body-costa-nua-2". Imported photos now live in `public/assets/produtos/<slug>/`.
> Uploads through the admin use a timestamp + random suffix and cannot collide.

## What the public site reads

`views/home/index.tsx` lists the store and filters to `active`, so hiding a
piece removes it from the site while it stays in the admin. Route `/` is already
dynamic (ADR-0020), so an edit shows up on the next request.

## Related

[[catalog-store]] · [[api-architecture]] · [[environment-variables]]
