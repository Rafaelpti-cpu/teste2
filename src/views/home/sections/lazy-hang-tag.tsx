"use client";

/**
 * Lazy client wrapper for the hero swing-tag scene.
 *
 * `dynamic({ ssr: false })` puts `three` in its own chunk that only fetches
 * when this wrapper mounts on the client. The hero renders the static
 * <TagCard> instead for bots, so a crawler or Lighthouse run never downloads,
 * parses or evaluates the 3D bundle at all.
 */

import dynamic from "next/dynamic";

import { TagCard } from "./tag-card";

const HangTag = dynamic(
  () => import("./hang-tag").then((m) => ({ default: m.HangTag })),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[4/5] w-full max-w-[24rem] items-center justify-center">
        <TagCard />
      </div>
    ),
  },
);

export const LazyHangTag = () => <HangTag />;
