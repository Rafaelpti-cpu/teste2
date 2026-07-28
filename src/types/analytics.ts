/** What a visitor did. Two kinds, because two questions matter to the shop. */
export type SiteEventType = "view" | "whatsapp";

export interface SiteEvent {
  id: string;
  type: SiteEventType;
  /** Pathname only — never the query string, which can carry anything. */
  path: string;
  /** Set when the event belongs to a piece, so it can be grouped by product. */
  productSlug: string | null;
  /** Random per-tab id. Separates visits from page views; identifies nobody. */
  visitor: string;
  createdAt: string;
}

export interface SiteEventInput {
  type: SiteEventType;
  path: string;
  productSlug?: string | null;
  visitor: string;
}

/** One day's totals, for the chart. */
export interface DailyCount {
  /** `YYYY-MM-DD`, in the shop's timezone. */
  day: string;
  views: number;
  visits: number;
  whatsapp: number;
}

/** How one piece performed over the window. */
export interface ProductCount {
  slug: string;
  /** Resolved from the catalogue; falls back to the slug if the piece is gone. */
  name: string;
  views: number;
  whatsapp: number;
}

export interface MetricsSummary {
  /** How many days back the window reaches, inclusive of today. */
  days: number;
  views: number;
  visits: number;
  whatsapp: number;
  daily: DailyCount[];
  products: ProductCount[];
  /**
   * `true` when the window hit the row cap, so the numbers below it are a
   * partial count rather than the whole window. See obsidian/backend/analytics.md.
   */
  truncated: boolean;
}
