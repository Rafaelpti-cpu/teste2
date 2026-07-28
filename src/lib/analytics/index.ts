/**
 * Analytics entry point — picks the backing and exposes the summary.
 *
 * Server-only, for the same reason as [[catalog-store]]: the Supabase side
 * reads the service-role key and the file side reads `node:fs`. The browser
 * reaches this through `POST /api/eventos`, never directly.
 *
 * 📖 Docs: obsidian/backend/analytics.md
 */

import { getCatalogStore } from "@/lib/catalog";
import { fileAnalyticsStore } from "@/lib/analytics/file-store";
import { supabaseAnalyticsStore } from "@/lib/analytics/supabase-store";
import { summarise } from "@/lib/analytics/summary";
import { EVENT_WINDOW_LIMIT, type AnalyticsBackend, type AnalyticsStore } from "@/lib/analytics/store";
import { getSupabaseConfig } from "@/lib/catalog/supabase-store";
import type { MetricsSummary } from "@/types/analytics";

export const getAnalyticsBackend = (): AnalyticsBackend =>
  getSupabaseConfig() ? "supabase" : "file";

export const getAnalyticsStore = (): AnalyticsStore =>
  getAnalyticsBackend() === "supabase"
    ? supabaseAnalyticsStore
    : fileAnalyticsStore;

/**
 * Everything the metrics screen needs, for the last `days` days.
 *
 * Resolves slugs to product names here rather than in the summary, so a piece
 * deleted from the catalogue still shows its slug instead of vanishing from the
 * history that explains last month's sales.
 */
export const getMetrics = async (days: number): Promise<MetricsSummary> => {
  const since = new Date(Date.now() - (days - 1) * 86_400_000);
  since.setHours(0, 0, 0, 0);

  const [events, products] = await Promise.all([
    getAnalyticsStore().listSince(since),
    getCatalogStore().list(),
  ]);

  const names = new Map(products.map((product) => [product.slug, product.name]));
  return summarise(events, days, names, events.length >= EVENT_WINDOW_LIMIT);
};

export type { AnalyticsBackend, AnalyticsStore };
