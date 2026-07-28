/**
 * The analytics store — one interface, two backings, mirroring [[catalog-store]].
 *
 * Deliberately tiny: write an event, read a window of events. Every number the
 * admin shows is computed from that window by `summarise()`, so neither backing
 * has to know what a "top product" is and the two can never disagree.
 *
 * 📖 Docs: obsidian/backend/analytics.md
 */

import type { SiteEvent, SiteEventInput } from "@/types/analytics";

/**
 * How many rows a single window read will pull back.
 *
 * The admin groups in memory rather than in SQL, which is honest at a local
 * shop's traffic and would not be at ten times it. When a window hits this cap
 * the summary is flagged `truncated` so the screen can say so instead of
 * quietly under-reporting. The fix, when it is needed, is a Postgres view —
 * written up in obsidian/backend/analytics.md.
 */
export const EVENT_WINDOW_LIMIT = 20_000;

export interface AnalyticsStore {
  /** Fire-and-forget: never throws at the caller, only logs. */
  record(input: SiteEventInput): Promise<void>;
  /** Newest first, capped at `EVENT_WINDOW_LIMIT`. */
  listSince(since: Date): Promise<SiteEvent[]>;
}

export type AnalyticsBackend = "file" | "supabase";
