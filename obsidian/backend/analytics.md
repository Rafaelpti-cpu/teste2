---
tags: [backend, analytics, stable]
updated: 2026-07-28
---

# Analytics — what the site did

The shop asked for "how many people are visiting, and which pieces are being
looked at". The build answers that, plus the question they did not ask and that
matters more: **which pieces turn into a WhatsApp conversation**. A piece with
many views and no clicks is a piece that looks good in a photo and disappoints
in the description; a piece with few views and many clicks is one to reorder.

ADR: [[decisions-log]] ADR-0027.

## Files

| File | Role |
|------|------|
| `src/types/analytics.ts` | `SiteEvent`, `MetricsSummary` and friends |
| `src/lib/analytics/store.ts` | The two-method interface + `EVENT_WINDOW_LIMIT` |
| `src/lib/analytics/file-store.ts` | `.data/events.json` — the zero-setup default |
| `src/lib/analytics/supabase-store.ts` | The `site_events` table over PostgREST |
| `src/lib/analytics/summary.ts` | Pure aggregation — the only place a number is computed |
| `src/lib/analytics/index.ts` | Backend picker + `getMetrics(days)` |
| `src/lib/analytics/client.ts` | Browser side: visitor id, `track()` |
| `src/components/analytics/page-beacon.tsx` | One view per page, mounted in the root layout |
| `src/app/api/eventos/route.ts` | `POST` — the only public write endpoint on the site |
| `src/views/admin/metrics-view.tsx` · `metrics-board.tsx` | The "Medições" tab |

Two backings behind one interface, exactly as in [[catalog-store]] — Supabase
when its variables are set, a local JSON file otherwise.

## The privacy design, which is the whole design

**Nothing personal is stored.** No IP, no user agent, no location, no cookie.
The table holds a type, a pathname, an optional product slug and a timestamp.

The one identifier is `visitor`: a random UUID in **`sessionStorage`**, which
the browser discards when the tab closes. It exists to tell "one person opened
four pieces" from "four people opened one piece" and it identifies nobody —
there is nothing to join it against, and tomorrow the same person is a new id.

> [!warning] Do not move the visitor id to `localStorage`
> It is the obvious "improvement" — it would give returning-visitor counts. It
> would also turn an anonymous counter into cross-session tracking, which needs
> consent under the LGPD and makes the privacy policy false as written. The
> policy describes the current design in "Contagem de acessos"; changing the
> storage means changing the policy first.

Consent is not gated on the cookie banner because there is nothing to consent
to. If that ever changes, it has to go behind the banner's analytics category.

## Why the browser posts, and not the server

Views are recorded from a client effect rather than during the server render.
Two reasons, both load-bearing:

- **Crawlers do not run JavaScript.** Google, WhatsApp's link preview and every
  scanner hitting the site would otherwise be counted as customers, and no
  bot-list would keep up. This filters them for free.
- **A database write stays off the page's critical path.** Nothing the customer
  waits for touches `site_events`.

`track()` prefers `navigator.sendBeacon`, which survives the page being torn
down — which is exactly what happens on the WhatsApp click, when the browser
hands the customer to another app mid-request.

## What is deliberately not counted

- **`/admin/*`.** The person reading the numbers would otherwise be the busiest
  visitor on the site. Excluded in `page-beacon.tsx`.
- **Strict Mode's double mount.** The beacon holds the counted pathname in a
  ref. Without it every number doubles in development — a bug shaped like
  traffic, which is the worst kind to find late.
- **Opening a piece is a view, wherever it happens.** Most customers never load
  `/produto/<slug>`; they tap a card and read the dialog. `ProductDialog` records
  that view itself, because it is the only place that knows it happened. Without
  it the main way pieces are browsed would be invisible.

## The scaling limit, written down before it bites

`getMetrics()` reads the window and groups **in memory**. `EVENT_WINDOW_LIMIT`
caps a read at 20 000 rows; when a window hits the cap, `MetricsSummary.truncated`
is `true` and the screen says the numbers are partial rather than quietly
under-reporting.

At a local shop's traffic this is honest and simple. At ten times it, it is not.
The fix is a Postgres view doing the grouping in SQL — `site_events` already has
the `created_at desc` index for it — and `listSince` becomes a read of a few
aggregated rows. Do that when the banner appears, not before.

The free Supabase tier gives 500 MB. These rows are small; the ceiling is far
away, but nothing prunes old events yet. That is the second thing to add.

## Setup

The Supabase table must exist before any of this records in production. It is in
`supabase/schema.sql` — run that file in the Supabase SQL editor (it is written
with `create table if not exists`, so re-running it is safe and only adds what is
missing). Without the table, `record()` logs and swallows the failure: the site
keeps working and the metrics stay at zero.

## Related

[[catalog-store]] · [[admin-area]] · [[api-layer]] · [[decisions-log]]
