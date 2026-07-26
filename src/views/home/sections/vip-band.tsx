import { ButtonLink } from "@/components/ui/button-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealHeading } from "@/components/ui/reveal-heading";
import { RevealText } from "@/components/ui/reveal-text";
import type { HomeContent } from "@/data/home";

export interface VipBandProps {
  content: HomeContent["vip"];
}

export const VipBand = ({ content }: VipBandProps) => (
  <section aria-labelledby="vip-title" className="container-page py-8 md:py-12">
    <div className="relative overflow-hidden rounded-panel bg-surface-inverse px-6 py-14 md:px-16 md:py-20">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -bottom-32 size-[28rem] rounded-pill bg-decor-accent opacity-20 blur-3xl"
      />

      <div className="relative flex flex-col items-start gap-6 md:max-w-[46ch]">
        <Eyebrow tone="inverse">{content.eyebrow}</Eyebrow>
        <RevealHeading
          id="vip-title"
          tag="h2"
          className="font-display text-3xl font-light tracking-tight text-foreground-inverse md:text-5xl"
        >
          {content.title}
        </RevealHeading>
        <RevealText
          className="text-base text-foreground-inverse/70"
          delayIn={160}
        >
          {content.description}
        </RevealText>
        <ButtonLink href={content.cta.href} variant="inverse">
          {content.cta.label}
        </ButtonLink>
      </div>
    </div>
  </section>
);
