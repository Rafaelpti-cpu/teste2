/**
 * The site's copy, editable from the admin.
 *
 * A single document rather than a collection, so this is simpler than the
 * catalogue: read it, write it whole. It picks its backing the same way
 * (`lib/catalog`) — Supabase when configured, a local JSON file otherwise —
 * and falls back to the defaults in `data/home.ts` when nothing is saved yet.
 *
 * Server-only: it reads `node:fs` and the Supabase service key.
 *
 * 📖 Docs: obsidian/backend/site-content.md
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { homeContent, type HomeContent } from "@/data/home";
import { ApiError } from "@/lib/api";
import { siteContentSchema } from "@/lib/content/schema";
import { getSupabaseConfig } from "@/lib/catalog/supabase-store";
import type { CatalogBackend } from "@/lib/catalog/store";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "content.json");
/** One row, one document. */
const ROW_ID = "home";

export const getContentBackend = (): CatalogBackend =>
  getSupabaseConfig() ? "supabase" : "file";

/**
 * Merges a saved document over the defaults before validating.
 *
 * Without this, adding a field to the schema would break every site that had
 * already saved its copy — the stored document simply would not have the new
 * key, and a required field would fail. New copy therefore appears with its
 * default until the shop edits it.
 */
const withDefaults = (saved: unknown): HomeContent => {
  if (!saved || typeof saved !== "object") return homeContent;

  const merged = { ...homeContent, ...(saved as Partial<HomeContent>) };
  const result = siteContentSchema.safeParse(merged);
  if (!result.success) {
    console.error("[content] documento salvo inválido, usando o padrão:", result.error.issues);
    return homeContent;
  }
  return merged;
};

const readFileDocument = async (): Promise<HomeContent> => {
  try {
    return withDefaults(JSON.parse(await readFile(DATA_FILE, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return homeContent;
    throw error;
  }
};

const writeFileDocument = async (content: HomeContent) => {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(content, null, 2), "utf8");
};

const supabaseRest = async (query: string, init: RequestInit = {}) => {
  const config = getSupabaseConfig();
  if (!config) {
    throw new ApiError(500, "supabase_not_configured", "Supabase não está configurado.");
  }

  const response = await fetch(`${config.url}/rest/v1/${query}`, {
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
    console.error("[content/supabase]", response.status, detail);
    throw new ApiError(502, "supabase_error", "Não foi possível salvar os textos.");
  }
  return response;
};

/** Reads the live copy. Falls back to the defaults, never throws for the site. */
export async function readSiteContent(): Promise<HomeContent> {
  if (getContentBackend() === "file") return readFileDocument();

  const response = await supabaseRest(
    `site_content?select=data&id=eq.${ROW_ID}`,
  );
  const [row] = (await response.json()) as { data: unknown }[];
  return withDefaults(row?.data);
}

/** Replaces the copy. The payload is validated by the route before it lands here. */
export async function writeSiteContent(content: HomeContent): Promise<HomeContent> {
  if (getContentBackend() === "file") {
    await writeFileDocument(content);
    return content;
  }

  await supabaseRest("site_content", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      id: ROW_ID,
      data: content,
      updated_at: new Date().toISOString(),
    }),
  });
  return content;
}

/** The shipped copy — what "Restaurar padrão" in the admin goes back to. */
export const defaultSiteContent = homeContent;
