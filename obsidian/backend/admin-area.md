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
- **Photos come first in the form.** The shop adds pieces from a phone standing
  next to the rail: the photo is both the first thing they have and the one
  field that gates saving. Asking for a name above it asks them to describe
  something they have not looked at yet.
- **Categories are created in the form, not in the code.** `ProductCategory` is
  free text, capped at `CATEGORY_MAX_LENGTH`. The `<select>` lists the sections
  already in use and ends in "+ Criar nova categoria…", which swaps it for a
  text input. A select rather than a free field with autocomplete, because
  reusing an existing section has to be the easiest path — "Feminino" and
  "feminino " typed by hand are two sections on the site and nothing warns
  anyone. The list is **derived from the catalogue** (`categoriesOf`), so a
  section appears with its first piece and disappears with its last; there is
  no second list to fall out of step. `DEFAULT_CATEGORIES` is only a preferred
  order — the four the shop opened with sort first, everything else follows
  alphabetically.
- **Rows stack** below `sm`: thumbnail and name on one line, actions wrapping
  underneath, instead of five controls squeezed into a row.
- **Search and category chips** sit above the list. Forty pieces is a lot of
  scrolling on a phone; search ignores case *and* accents, so "tenis" finds
  "Tênis".

Verified at 375 × 812: no horizontal overflow on the list or the form.

## Access

Named users with e-mail and password, managed at **/admin/acessos**.

The area is **open while no access exists** — the shop asked to work without a
login before launch. Create the first one and everything locks: pages redirect
to `/admin/entrar`, endpoints answer 401.

### Passwords are never stored

`lib/admin/users.ts` keeps a **scrypt hash with a random per-user salt**
(`scrypt$<salt>$<hash>`), so the stored record cannot be turned back into the
password — not by us, not by whoever holds the database. A forgotten password is
*replaced*, never recovered. `toPublic()` strips the hash before anything
reaches the API, and the login answers "E-mail ou senha incorretos" for both a
wrong password and an unknown e-mail, so it cannot be used to discover which
addresses exist.

### The session

A signed cookie, not a session table: `<userId>.<hmac>`, where the HMAC is keyed
by **that user's password hash**. One lookup verifies it, no extra secret needs
configuring, and changing a password invalidates every cookie that user had —
including their own, which is why a self password change signs you out.
HttpOnly, SameSite=Lax, Secure in production, 30 days. Login attempts are
throttled per IP, 8 per minute, in process.

### The first access

`ensureSeedUser()` turns `ADMIN_EMAIL` + `ADMIN_PASSWORD` into a real user the
first time the admin is opened, hashing the password. After that the variables
are never read again — the admin owns the accesses.

### Guards worth knowing

- You cannot delete your own access.
- You cannot delete the last one.
- E-mails are compared lower-cased, so `LOJA@` and `loja@` are the same access.
- Minimum password length is 8.

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
