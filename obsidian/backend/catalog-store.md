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

## Migrating file → Supabase

The stored shapes are identical, so the JSON rows can be posted straight into
the table. Do it before setting the env vars, or the admin will look empty
(the new backing starts with nothing but the seed).

## Related

[[admin-area]] · [[api-architecture]] · [[folder-structure]]
