import { ButtonLink } from "@/components/ui/button-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealHeading } from "@/components/ui/reveal-heading";
import { RevealText } from "@/components/ui/reveal-text";
import type { HomeContent } from "@/data/home";

import { HeroPhoto } from "./hero-photo";
import { LazyHangTag } from "./lazy-hang-tag";
import { TagCard } from "./tag-card";

export interface HeroProps {
  content: HomeContent["hero"];
  /** Bots get the flat tag: the 3D chunk is never fetched for them. */
  withScene: boolean;
}

export const Hero = ({ content, withScene }: HeroProps) => (
  <section aria-labelledby="hero-title" className="relative overflow-hidden">
    {/* Soft brand glow behind the tag — decorative. */}
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -top-10 right-[-6rem] size-[22rem] rounded-pill bg-surface-accent blur-3xl lg:-top-24 lg:right-0 lg:size-[38rem]"
    />

    <div className="container-page relative grid gap-8 pt-6 pb-10 md:gap-10 md:pt-10 md:pb-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-6 lg:pt-16 lg:pb-20">
      <div className="flex flex-col items-start gap-5 md:gap-7">
        <Eyebrow>{content.eyebrow}</Eyebrow>

        <RevealHeading
          id="hero-title"
          tag="h1"
          className="max-w-[12ch] font-display text-5xl font-light tracking-tight text-foreground md:text-7xl"
        >
          {content.title.join(" ")}
        </RevealHeading>

        <RevealText
          className="max-w-[46ch] text-base text-foreground-muted md:text-lg"
          delayIn={220}
        >
          {content.description}
        </RevealText>

        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href={content.primaryCta.href}>
            {content.primaryCta.label}
          </ButtonLink>
          <ButtonLink href={content.secondaryCta.href} variant="outline">
            {content.secondaryCta.label}
          </ButtonLink>
        </div>

        <dl className="mt-1 grid w-full grid-cols-3 gap-4 md:mt-2 md:flex md:w-auto md:flex-wrap md:items-end md:gap-x-10">
          {content.stats.map((stat) => (
            // Reversed visually so the number leads; DOM order stays term → value.
            <div key={stat.label} className="flex flex-col-reverse gap-1">
              <dt className="text-xs tracking-[0.2em] text-foreground-muted uppercase">
                {stat.label}
              </dt>
              <dd className="font-display text-3xl font-light text-foreground">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/*
        On a phone the tag hangs against a dark plinth. It is a white printed
        card: on the cream page at 250px it read as a pale smudge, and the
        contrast is what makes it look like an object instead of an artefact.
        The plinth is phone-only — from `sm` up the canvas is large enough that
        the tag carries itself, and a dark block there would just be a hole in
        the page. See obsidian/frontend/hero-scene.md.
      */}
      <div className="flex justify-center rounded-panel bg-surface-inverse px-4 py-6 sm:bg-transparent sm:p-0 lg:justify-end">
        {withScene ? (
          <LazyHangTag />
        ) : (
          <div className="flex aspect-[4/5] w-full max-w-[15rem] items-center justify-center sm:max-w-[24rem]">
            <TagCard />
          </div>
        )}
      </div>
    </div>

    <div className="container-page pb-4">
      <HeroPhoto src={content.image.src} alt={content.image.alt} />
    </div>
  </section>
);
