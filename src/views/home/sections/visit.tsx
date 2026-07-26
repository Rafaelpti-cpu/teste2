import { ButtonLink } from "@/components/ui/button-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealHeading } from "@/components/ui/reveal-heading";
import type { StoreInfo } from "@/data/home";

export interface VisitProps {
  copy: { eyebrow: string; title: string; mapsLabel: string; whatsappLabel: string };
  store: StoreInfo;
}

export const Visit = ({ copy, store }: VisitProps) => (
  <section
    id="visite"
    aria-labelledby="visite-title"
    className="container-page scroll-mt-24 py-16 md:py-24"
  >
    <div className="grid gap-10 rounded-panel bg-surface-muted px-6 py-12 md:grid-cols-2 md:gap-16 md:px-14 md:py-16">
      <div className="flex flex-col items-start gap-6">
        <Eyebrow>{copy.eyebrow}</Eyebrow>
        <RevealHeading
          id="visite-title"
          tag="h2"
          className="font-display text-4xl font-light tracking-tight text-foreground md:text-5xl"
        >
          {copy.title}
        </RevealHeading>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={store.mapsHref}>{copy.mapsLabel}</ButtonLink>
          <ButtonLink href={store.whatsappHref} variant="outline">
            {copy.whatsappLabel}
          </ButtonLink>
        </div>
      </div>

      <dl className="grid gap-8 self-center">
        <div className="flex flex-col gap-2">
          <dt className="text-xs tracking-[0.22em] text-foreground-muted uppercase">
            Endereço
          </dt>
          <dd>
            <address className="text-base text-foreground not-italic">
              {store.street} — {store.city}, {store.state}, {store.postalCode}
            </address>
          </dd>
        </div>

        <div className="flex flex-col gap-2">
          <dt className="text-xs tracking-[0.22em] text-foreground-muted uppercase">
            Horário
          </dt>
          <dd className="flex flex-col gap-1 text-base text-foreground">
            {store.hours.map((slot) => (
              <span key={slot.days}>
                <strong className="font-medium">{slot.days}</strong> · {slot.time}
              </span>
            ))}
          </dd>
        </div>

        <div className="flex flex-col gap-2">
          <dt className="text-xs tracking-[0.22em] text-foreground-muted uppercase">
            Telefone / WhatsApp
          </dt>
          <dd>
            <a
              href={store.phoneHref}
              className="text-base text-foreground underline underline-offset-4 transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground-accent"
            >
              {store.phoneLabel}
            </a>
          </dd>
        </div>
      </dl>
    </div>
  </section>
);
