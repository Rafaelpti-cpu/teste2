import { z } from "zod";

import { getAnalyticsStore } from "@/lib/analytics";
import { handle } from "@/lib/api";

/**
 * `POST /api/eventos` — records a page view or a WhatsApp click.
 *
 * The one endpoint on the site that anyone may call, so it is written to be
 * boring under abuse: the body is a fixed shape, every field is length-capped,
 * the path is normalised to a pathname, and nothing about the caller is stored.
 * The worst a flood achieves is junk rows the shop can ignore.
 *
 * Called from the browser rather than from the server render on purpose — it
 * keeps crawlers out of the numbers without maintaining a bot list, and it
 * keeps a database write off the page's critical path.
 *
 * 📖 Docs: obsidian/backend/analytics.md
 */

const schema = z.object({
  type: z.enum(["view", "whatsapp"]),
  path: z.string().min(1).max(512),
  productSlug: z
    .string()
    .max(200)
    .regex(/^[a-z0-9-]+$/, "slug inválido")
    .nullish(),
  visitor: z.string().min(8).max(64),
});

/** Keeps a query string or a full URL from ever reaching the table. */
const toPathname = (value: string) => {
  try {
    return new URL(value, "https://renovacloset.com").pathname.slice(0, 512);
  } catch {
    return "/";
  }
};

export const POST = handle(async (req) => {
  const input = schema.parse(await req.json());

  await getAnalyticsStore().record({
    type: input.type,
    path: toPathname(input.path),
    productSlug: input.productSlug ?? null,
    visitor: input.visitor,
  });

  return { recorded: true };
});
