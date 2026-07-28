/**
 * File-backed analytics — the zero-setup default, matching [[catalog-store]].
 *
 * Events live in `.data/events.json` (gitignored). Requires a writable disk, so
 * it is for local work; on a serverless host the Supabase backing takes over.
 *
 * 📖 Docs: obsidian/backend/analytics.md
 */

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { EVENT_WINDOW_LIMIT, type AnalyticsStore } from "@/lib/analytics/store";
import type { SiteEvent, SiteEventInput } from "@/types/analytics";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "events.json");

/** Keeps the file from growing without bound on a long-lived dev machine. */
const MAX_STORED = 50_000;

/** Serialises writes, so two concurrent beacons cannot lose each other. */
let queue: Promise<unknown> = Promise.resolve();

const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
};

const read = async (): Promise<SiteEvent[]> => {
  try {
    return JSON.parse(await readFile(DATA_FILE, "utf8")) as SiteEvent[];
  } catch {
    return [];
  }
};

export const fileAnalyticsStore: AnalyticsStore = {
  async record(input: SiteEventInput) {
    try {
      await enqueue(async () => {
        const events = await read();
        events.push({
          id: randomUUID(),
          type: input.type,
          path: input.path,
          productSlug: input.productSlug ?? null,
          visitor: input.visitor,
          createdAt: new Date().toISOString(),
        });
        await mkdir(DATA_DIR, { recursive: true });
        await writeFile(
          DATA_FILE,
          JSON.stringify(events.slice(-MAX_STORED)),
          "utf8",
        );
      });
    } catch (error) {
      console.error("[analytics/file] record failed:", error);
    }
  },

  async listSince(since: Date) {
    const events = await read();
    const cutoff = since.getTime();
    return events
      .filter((event) => new Date(event.createdAt).getTime() >= cutoff)
      .reverse()
      .slice(0, EVENT_WINDOW_LIMIT);
  },
};
