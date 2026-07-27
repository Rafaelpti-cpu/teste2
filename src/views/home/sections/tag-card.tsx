import Image from "next/image";

export interface TagCardProps {
  className?: string;
}

/**
 * The hero swing tag as flat DOM.
 *
 * Three jobs: it is what crawlers and social-preview screenshots get instead of
 * the WebGL scene, it is the no-WebGL fallback, and it is the placeholder the
 * canvas cross-fades over once the scene has warmed up.
 *
 * It uses the theme-independent `tag-*` roles for exactly the reason the scene
 * does — printed card looks the same in either theme, so the swap between this
 * and the canvas is invisible.
 */
export const TagCard = ({ className = "" }: TagCardProps) => (
  <figure
    className={`flex aspect-[2/3] w-[11rem] -rotate-6 sm:w-[15rem] flex-col items-center justify-center gap-3 rounded-panel sm:gap-5 border border-tag-accent/50 bg-tag-paper px-4 py-5 shadow-[0_2rem_4rem_-2rem_rgba(0,0,0,0.35)] sm:px-6 sm:py-8 ${className}`}
  >
    <span
      aria-hidden="true"
      className="size-3.5 rounded-pill border border-tag-accent/50"
    />
    <Image
      src="/assets/brand/renova-hanger.png"
      alt=""
      width={780}
      height={518}
      className="w-3/5"
      priority
    />
    <figcaption className="flex flex-col items-center gap-1 font-display">
      <span className="text-lg tracking-[0.28em] text-tag-ink">RENOVA</span>
      <span className="text-xs font-light tracking-[0.42em] text-tag-ink">
        CLOSET
      </span>
    </figcaption>
    <span aria-hidden="true" className="h-px w-2/5 bg-tag-accent" />
    <span className="font-display text-[0.625rem] tracking-[0.22em] text-tag-ink-muted">
      SANTA HELENA · PR
    </span>
    <span className="font-display text-[0.625rem] tracking-[0.22em] text-tag-accent">
      3X SEM JUROS
    </span>
  </figure>
);
