"use client";

import Image from "next/image";

import { SpringTrigger } from "@/components/animation/springs/spring-trigger";

export interface HeroPhotoProps {
  src: string;
  alt: string;
}

/**
 * Full-bleed store photograph that drifts against the scroll.
 *
 * The image is oversized inside a clipping frame so the parallax never exposes
 * an edge; `mode="scrub"` ties the offset directly to scroll progress.
 */
export const HeroPhoto = ({ src, alt }: HeroPhotoProps) => (
  <SpringTrigger
    tag="figure"
    innerTag="div"
    mode="scrub"
    start="top bottom"
    end="bottom top"
    from={{ y: "-7%" }}
    to={{ y: "7%" }}
    className="relative aspect-[1920/786] overflow-hidden rounded-panel md:aspect-auto md:h-[30rem]"
    innerClassName="absolute inset-x-0 -top-[7%] h-[114%]"
  >
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 1024px) 100vw, 82rem"
      className="object-cover"
      priority
    />
  </SpringTrigger>
);
