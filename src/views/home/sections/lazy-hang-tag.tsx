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
import { useEffect, useState } from "react";

import { TagCard } from "./tag-card";

const HangTag = dynamic(
  () => import("./hang-tag").then((m) => ({ default: m.HangTag })),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[4/5] w-full max-w-[15rem] items-center justify-center sm:max-w-[24rem]">
        <TagCard />
      </div>
    ),
  },
);

/**
 * Is this a device the 3D scene is worth 552 KB on?
 *
 * That is what the `three` chunk weighs — more than every photo on the home
 * page put together, and it is decoration. On a phone it downloads after the
 * page, competing with the product covers for the same pipe, which is the
 * "the pieces take five seconds" the shop kept reporting after the images were
 * already small.
 *
 * A pointer that can hover is the test, not screen width: it means a mouse,
 * which means a desktop, which means the scene is both affordable and
 * interactive — the tag follows the cursor there and cannot on a touchscreen.
 *
 * Phones get `<TagCard>`: the same tag as flat DOM, already built as the
 * crawler and no-WebGL fallback, and already what everyone sees for the first
 * moment while the scene compiles. Nobody loses a tag; some people stop paying
 * half a megabyte for it to swing.
 */
const useWantsScene = () => {
  const [wants, setWants] = useState(false);
  useEffect(() => {
    setWants(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);
  return wants;
};

export const LazyHangTag = () => {
  const wantsScene = useWantsScene();

  if (!wantsScene) {
    return (
      <div className="flex aspect-[4/5] w-full max-w-[15rem] items-center justify-center sm:max-w-[24rem]">
        <TagCard />
      </div>
    );
  }

  return <HangTag />;
};
