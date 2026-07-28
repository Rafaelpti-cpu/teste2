/**
 * Supabase-backed analytics — the `site_events` table.
 *
 * Same plain-`fetch` PostgREST approach as [[catalog-store]]: no SDK, no extra
 * dependency, service-role key server-side only.
 *
 * 📖 Docs: obsidian/backend/analytics.md
 */

import { getSupabaseConfig } from "@/lib/catalog/supabase-store";
import { EVENT_WINDOW_LIMIT, type AnalyticsStore } from "@/lib/analytics/store";
import type { SiteEvent, SiteEventInput, SiteEventType } from "@/types/analytics";

interface EventRow {
  id: string;
  type: string;
  path: string;
  product_slug: string | null;
  visitor: string;
  created_at: string;
}

const fromRow = (row: EventRow): SiteEvent => ({
  id: row.id,
  type: row.type as SiteEventType,
  path: row.path,
  productSlug: row.product_slug,
  visitor: row.visitor,
  createdAt: row.created_at,
});

const rest = async (path: string, init: RequestInit = {}) => {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.serviceKey,
      authorization: `Bearer ${config.serviceKey}`,
      "content-type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase ${response.status}: ${detail}`);
  }
  return response;
};

export const supabaseAnalyticsStore: AnalyticsStore = {
  async record(input: SiteEventInput) {
    // Measurement must never break a page view. Swallow and log.
    try {
      await rest("site_events", {
        method: "POST",
        headers: { prefer: "return=minimal" },
        body: JSON.stringify({
          type: input.type,
          path: input.path,
          product_slug: input.productSlug ?? null,
          visitor: input.visitor,
        }),
      });
    } catch (error) {
      console.error("[analytics/supabase] record failed:", error);
    }
  },

  async listSince(since: Date) {
    const query = new URLSearchParams({
      select: "id,type,path,product_slug,visitor,created_at",
      created_at: `gte.${since.toISOString()}`,
      order: "created_at.desc",
      limit: String(EVENT_WINDOW_LIMIT),
    });
    const response = await rest(`site_events?${query}`);
    const rows = (await response.json()) as EventRow[];
    return rows.map(fromRow);
  },
};
