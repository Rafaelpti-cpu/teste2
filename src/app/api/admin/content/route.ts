import { assertAdmin } from "@/lib/admin/auth";
import { handle } from "@/lib/api";
import { readSiteContent, writeSiteContent } from "@/lib/content";
import { siteContentSchema } from "@/lib/content/schema";
import type { HomeContent } from "@/data/home";

export const GET = handle(async () => {
  await assertAdmin();
  return readSiteContent();
});

/** Whole-document save — the form always sends everything it rendered. */
export const PUT = handle(async (req) => {
  await assertAdmin();
  const content = siteContentSchema.parse(await req.json());
  return writeSiteContent(content as HomeContent);
});
