import { ButtonLink } from "@/components/ui/button-link";
import { Eyebrow } from "@/components/ui/eyebrow";
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

        {/*
          Plain text, not a reveal — and this is the fix for the site "feeling
          slow" rather than a style preference.

          Lighthouse put Largest Contentful Paint at 4.5–5.8 s on every run
          while First Contentful Paint was 0.9–1.0 s. Something big was painting
          four seconds after the rest. It was this: `RevealHeading` renders each
          letter in a span at `opacity: 0` and animates them in, so the biggest
          text on the page — the shop's headline — did not exist visually until
          ~950 KB of JavaScript had downloaded and hydrated. Only an `sr-only`
          copy was in the HTML, which screen readers get and eyes do not.

          These two are now ordinary elements, painted with the first byte.
          Every other heading on the page keeps its reveal: they are below the
          fold, so nobody waits on them, and the motion the shop asked for
          survives where it costs nothing.
        */}
        <h1
          id="hero-title"
          className="max-w-[12ch] font-display text-5xl font-light tracking-tight text-foreground md:text-7xl"
        >
          {content.title.join(" ")}
        </h1>

        <p className="max-w-[46ch] text-base text-foreground-muted md:text-lg">
          {content.description}
        </p>

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
        No panel behind the tag — it hangs on the page itself. A dark plinth was
        tried on phones while the tag was still being drawn at a third of the
        screen's resolution; once that was fixed the contrast stopped earning
        its place, and the shop asked for the rose ground back. On `lg` the glow
        above sits behind the tag; on a phone it stays up with the heading and
        the tag hangs on plain cream. See obsidian/frontend/hero-scene.md.
      */}
      <div className="flex justify-center lg:justify-end">
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
