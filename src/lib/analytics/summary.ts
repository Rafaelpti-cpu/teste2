/**
 * Turns raw events into the numbers the admin shows.
 *
 * A pure function on purpose: both backings hand it the same window and get the
 * same summary, and it can be reasoned about without a database.
 *
 * 📖 Docs: obsidian/backend/analytics.md
 */

import type {
  DailyCount,
  MetricsSummary,
  ProductCount,
  SiteEvent,
} from "@/types/analytics";

/**
 * The shop is in Paraná. Grouping by UTC would put an 8pm sale on the next day,
 * which is exactly the hour a clothing shop sells — so days are cut in local
 * time, not UTC.
 */
const TIME_ZONE = "America/Sao_Paulo";

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** `YYYY-MM-DD` in the shop's timezone — `en-CA` formats exactly that way. */
export const localDay = (date: Date): string => dayFormatter.format(date);

/** Every day in the window, so a quiet day is a zero and not a gap. */
const emptyDays = (days: number): Map<string, DailyCount> => {
  const out = new Map<string, DailyCount>();
  const now = Date.now();
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = localDay(new Date(now - i * 86_400_000));
    out.set(day, { day, views: 0, visits: 0, whatsapp: 0 });
  }
  return out;
};

export const summarise = (
  events: SiteEvent[],
  days: number,
  productNames: Map<string, string>,
  truncated: boolean,
): MetricsSummary => {
  const daily = emptyDays(days);
  /** Visitor ids seen per day — a visit is one id on one day, not one row. */
  const visitorsByDay = new Map<string, Set<string>>();
  const visitors = new Set<string>();
  const products = new Map<string, ProductCount>();

  let views = 0;
  let whatsapp = 0;

  for (const event of events) {
    const day = localDay(new Date(event.createdAt));
    const bucket = daily.get(day);
    // Outside the window (clock skew, a late beacon) — counted nowhere.
    if (!bucket) continue;

    visitors.add(event.visitor);
    let seen = visitorsByDay.get(day);
    if (!seen) {
      seen = new Set<string>();
      visitorsByDay.set(day, seen);
    }
    seen.add(event.visitor);

    if (event.type === "view") {
      views += 1;
      bucket.views += 1;
    } else {
      whatsapp += 1;
      bucket.whatsapp += 1;
    }

    if (event.productSlug) {
      const slug = event.productSlug;
      let entry = products.get(slug);
      if (!entry) {
        entry = { slug, name: productNames.get(slug) ?? slug, views: 0, whatsapp: 0 };
        products.set(slug, entry);
      }
      if (event.type === "view") entry.views += 1;
      else entry.whatsapp += 1;
    }
  }

  for (const [day, seen] of visitorsByDay) {
    const bucket = daily.get(day);
    if (bucket) bucket.visits = seen.size;
  }

  return {
    days,
    views,
    visits: visitors.size,
    whatsapp,
    daily: [...daily.values()],
    // Interest first: a piece people ask about beats a piece people scroll past.
    products: [...products.values()].sort(
      (a, b) => b.whatsapp - a.whatsapp || b.views - a.views,
    ),
    truncated,
  };
};
