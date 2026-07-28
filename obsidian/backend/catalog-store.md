---
tags: [backend, catalog, stable]
updated: 2026-07-26
---

# Catalogue Store

Where products live. One interface — `CatalogStore` in
`src/lib/catalog/store.ts` — with two implementations, chosen at runtime by
whether Supabase credentials are present.

| | file *(default)* | supabase |
|---|---|---|
| Products | `.data/products.json` (gitignored) | `public.products` table |
| Photos | `public/assets/produtos/` | Storage bucket `product-images` |
| Needs | a writable disk | nothing but the env vars |
| Good for | local work, a VPS, Railway | anywhere, including Vercel |
| Picked when | `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` unset | both set |

`getCatalogStore()` returns whichever is active and `getCatalogBackend()` names
it — the admin prints that name on every page, so which one is answering is
never a guess. ADR: [[decisions-log]] ADR-0022.

## Rules

- **Server-only.** `lib/catalog/index.ts` pulls in `node:fs` and the Supabase
  service-role key. The browser reaches the catalogue through `/api/admin/*`,
  never by importing this.
- **The seed runs once.** First read of an empty store writes
  `src/data/catalog-seed.ts` into it. After that the admin owns the data and
  editing the seed file changes nothing.
- **Writes are serialised** in the file store. Two admin tabs saving at once
  would otherwise read-modify-write the same JSON and one edit would vanish.
- **Slugs are unique**, derived from the name, and re-derived on rename.

## The `.partial()` trap

`productPatchSchema` is built from a **defaults-free** base
(`lib/catalog/schema.ts`). This is not stylistic:

> `z.object({ sizes: z.array(...).default([]) }).partial()` still applies the
> default. A `PATCH` carrying only `{ active: false }` parses into
> `{ active: false, sizes: [] }`, and the store spreads that over the record —
> silently wiping the size grade.

Caught in testing the "No site / Oculta" toggle, which sends exactly that body.
Defaults belong to `productInputSchema` (creation) only, so that on a patch
**absent means "leave it alone"**.

## Supabase setup

1. Create a project (free tier is enough) → **SQL Editor** → run
   `supabase/schema.sql`.
2. **Storage** → new bucket named `product-images`, marked **public**.
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the environment.

RLS is enabled with no policies: only the service role — i.e. this server —
can read or write. Do not disable it.

There is no `@supabase/supabase-js` dependency: the six calls involved are plain
`fetch` against PostgREST and Storage, which keeps the serverless bundle small.

## Photo storage has a ceiling, and the admin shows it

`src/lib/catalog/storage.ts` sums the bucket (paginated, 1000 at a time; folder
placeholders carry no `metadata` and are skipped) and compares it to
`SUPABASE_STORAGE_LIMIT_MB`, default 1024 — the free tier.

Two things use it:

- **A gauge in the admin chrome**, on every page rather than behind a settings
  link. A number you have to go looking for is one you read for the first time
  on the day it runs out. Quiet under 75 %, then it starts saying what to do.
- **The upload endpoint refuses** a file that would cross the limit, with a 507
  and a sentence in Portuguese. Without it, Supabase rejects the write itself —
  as a 400, halfway through a batch, with some photos already saved and a
  message nobody can act on.

> [!important] `null` means "unknown", and unknown never blocks
> `getStorageUsage()` returns `null` on the file backing and whenever the
> listing fails. Both the gauge and the guard treat that as "carry on". A
> monitoring feature must not be able to stop the shop from working.

The reading is cached for 60 s and invalidated after each upload, so the gauge
moves immediately without listing the bucket on every page load.

> [!warning] That cache is per-bundle, and invalidation does not cross chunks
> It is a module variable, and Next bundles route handlers and pages into
> separate server chunks — each gets its own copy. `invalidateStorageUsage()`
> after the orphan sweep clears the route handler's and leaves the page's
> untouched. The page then rendered "no orphans left" above a gauge still
> claiming the old total, which is exactly the kind of wrong that erodes trust
> in a number.
>
> `getStorageReport()` therefore derives usage from **its own** listing rather
> than calling `getStorageUsage()`, and the Espaço view passes that down to the
> shell instead of asking again. **Anything that shows two of these numbers must
> read them from one listing.** Caught by testing the sweep end to end against a
> stub; a unit test of either half would have passed.

## Orphan photos

Deleting a piece removes its row and **leaves its photos in the bucket**, and
replacing a photo in the form abandons the old file. A bucket therefore grows
quietly, and the only evidence is the gauge creeping up.

The "Espaço" tab lists what is loose, how much it weighs, and sweeps it on a
button. `getStorageReport()` computes the orphan set by diffing the bucket
against every `images` entry across the catalogue; `objectNameOf()` maps a
public URL back to an object name and returns `null` for the seeded photos that
live in `public/`, which cost the bucket nothing.

The sweep is **manual and visible**, not something `remove()` does on the way
past. A file is an orphan only relative to the catalogue *as read right now* —
if that read ever came back short, deleting on its basis would destroy photos
still in use. A button the shop presses, showing what will go, cannot be
triggered by a bad read at three in the morning. `DELETE /api/admin/espaco`
recomputes the set server-side rather than trusting the list the browser was
shown, so a photo added between render and click is never caught in it.

Uploads are stored **as they arrive** — a phone photo is 3–4 MB, so the ceiling
is roughly 285 photos. Nothing resizes before upload yet; that is the obvious
next lever, and it would also fix the slow upload over mobile data in the shop.

## Migrating file → Supabase

The stored shapes are identical, so the JSON rows can be posted straight into
the table. Do it before setting the env vars, or the admin will look empty
(the new backing starts with nothing but the seed).

## Related

[[admin-area]] · [[api-architecture]] · [[folder-structure]]
