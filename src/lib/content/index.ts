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

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

/** Reads get three tries; writes get one. Same reasoning as [[catalog-store]]. */
const READ_ATTEMPTS = 3;
const RETRY_DELAY_MS = 150;

const supabaseRest = async (query: string, init: RequestInit = {}) => {
  const config = getSupabaseConfig();
  if (!config) {
    throw new ApiError(500, "supabase_not_configured", "Supabase não está configurado.");
  }

  const isRead = !init.method || init.method.toUpperCase() === "GET";
  const attempts = isRead ? READ_ATTEMPTS : 1;

  let response: Response | null = null;
  let networkError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    networkError = null;
    try {
      response = await fetch(`${config.url}/rest/v1/${query}`, {
        ...init,
        headers: {
          apikey: config.serviceKey,
          authorization: `Bearer ${config.serviceKey}`,
          "content-type": "application/json",
          ...init.headers,
        },
        cache: "no-store",
      });
    } catch (cause) {
      networkError = cause;
    }

    const retriable =
      networkError !== null || (response !== null && response.status >= 500);
    if (!retriable) break;
    if (attempt < attempts) await sleep(RETRY_DELAY_MS * attempt);
  }

  if (!response) {
    console.error("[content/supabase] sem resposta:", networkError);
    throw new ApiError(502, "supabase_error", "Não foi possível falar com o banco.");
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[content/supabase]", response.status, detail);
    throw new ApiError(
      502,
      "supabase_error",
      `O banco recusou a leitura dos textos: HTTP ${response.status}`,
    );
  }
  return response;
};

/**
 * Reads the live copy. **Never throws** — the storefront gets the defaults
 * instead of an error page.
 *
 * The comment above used to say exactly this while the code did the opposite:
 * one transient failure reading `site_content` took the whole home page down,
 * which is what the shop was seeing as "sometimes it breaks and a refresh
 * fixes it".
 *
 * Degrading is right *here* and would be wrong for the catalogue. These are
 * headings and paragraphs, and `homeContent` is a complete, sensible set of
 * them — a visitor cannot tell that the shop had edited a subtitle. A missing
 * catalogue is the opposite: an empty grid says "this shop has nothing", which
 * is worse than admitting something broke. So this falls back and the products
 * read still fails loudly.
 */
export async function readSiteContent(): Promise<HomeContent> {
  try {
    if (getContentBackend() === "file") return await readFileDocument();

    const response = await supabaseRest(
      `site_content?select=data&id=eq.${ROW_ID}`,
    );
    const [row] = (await response.json()) as { data: unknown }[];
    return withDefaults(row?.data);
  } catch (error) {
    console.error(
      "[content] leitura falhou, servindo os textos padrão:",
      error,
    );
    return homeContent;
  }
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
