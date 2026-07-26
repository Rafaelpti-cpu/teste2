"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { HomeContent } from "@/data/home";
import { apiFetch } from "@/lib/api-client";

export interface ContentFormProps {
  content: HomeContent;
  /** The shipped copy, for "restaurar padrão". */
  defaults: HomeContent;
}

const field =
  "w-full rounded-control border border-border-subtle bg-surface-raised px-3 py-2.5 text-sm outline-none focus-visible:border-action-primary";

/** A labelled input. Kept local — nothing else in the project needs it yet. */
const Field = ({
  label,
  value,
  onChange,
  hint,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  multiline?: boolean;
}) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-sm text-foreground">{label}</span>
    {multiline ? (
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${field} resize-y`}
      />
    ) : (
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={field}
      />
    )}
    {hint && <span className="text-xs text-foreground-muted">{hint}</span>}
  </label>
);

const Group = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="flex flex-col gap-4 rounded-card border border-border-subtle p-5">
    <h2 className="font-display text-lg font-light text-foreground">{title}</h2>
    {children}
  </section>
);

export const ContentForm = ({ content, defaults }: ContentFormProps) => {
  const router = useRouter();
  const [draft, setDraft] = useState<HomeContent>(content);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Immutable deep-set for the handful of nested paths the form touches. */
  const patch = (updater: (current: HomeContent) => HomeContent) => {
    setDraft(updater);
    setSaved(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch<HomeContent>("/api/admin/content", {
        method: "PUT",
        body: JSON.stringify(draft),
      });
      setSaved(true);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex max-w-[52rem] flex-col gap-6">
      <Group title="Topo do site">
        <Field
          label="Linha pequena acima do título"
          value={draft.hero.eyebrow}
          onChange={(v) => patch((c) => ({ ...c, hero: { ...c.hero, eyebrow: v } }))}
        />
        <Field
          label="Título principal"
          value={draft.hero.title.join(" ")}
          hint="Aparece grande, na primeira tela. Ele quebra a linha sozinho."
          onChange={(v) =>
            patch((c) => ({ ...c, hero: { ...c.hero, title: [v] } }))
          }
        />
        <Field
          label="Texto abaixo do título"
          multiline
          value={draft.hero.description}
          onChange={(v) =>
            patch((c) => ({ ...c, hero: { ...c.hero, description: v } }))
          }
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {draft.hero.stats.map((stat, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Field
                label={`Número ${index + 1}`}
                value={stat.value}
                onChange={(v) =>
                  patch((c) => ({
                    ...c,
                    hero: {
                      ...c.hero,
                      stats: c.hero.stats.map((s, i) =>
                        i === index ? { ...s, value: v } : s,
                      ),
                    },
                  }))
                }
              />
              <Field
                label="Legenda"
                value={stat.label}
                onChange={(v) =>
                  patch((c) => ({
                    ...c,
                    hero: {
                      ...c.hero,
                      stats: c.hero.stats.map((s, i) =>
                        i === index ? { ...s, label: v } : s,
                      ),
                    },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </Group>

      <Group title="Faixa que desliza">
        {draft.marquee.map((item, index) => (
          <Field
            key={index}
            label={`Frase ${index + 1}`}
            value={item}
            onChange={(v) =>
              patch((c) => ({
                ...c,
                marquee: c.marquee.map((m, i) => (i === index ? v : m)),
              }))
            }
          />
        ))}
      </Group>

      <Group title="Categorias">
        <Field
          label="Linha pequena"
          value={draft.sections.categories.eyebrow}
          onChange={(v) =>
            patch((c) => ({
              ...c,
              sections: {
                ...c.sections,
                categories: { ...c.sections.categories, eyebrow: v },
              },
            }))
          }
        />
        <Field
          label="Título"
          value={draft.sections.categories.title}
          onChange={(v) =>
            patch((c) => ({
              ...c,
              sections: {
                ...c.sections,
                categories: { ...c.sections.categories, title: v },
              },
            }))
          }
        />
        <Field
          label="Texto explicativo"
          multiline
          value={draft.sections.categories.text ?? ""}
          onChange={(v) =>
            patch((c) => ({
              ...c,
              sections: {
                ...c.sections,
                categories: { ...c.sections.categories, text: v },
              },
            }))
          }
        />
        {draft.categories.map((category, index) => (
          <Field
            key={category.slug}
            label={`Descrição de "${category.name}"`}
            value={category.tagline}
            onChange={(v) =>
              patch((c) => ({
                ...c,
                categories: c.categories.map((item, i) =>
                  i === index ? { ...item, tagline: v } : item,
                ),
              }))
            }
          />
        ))}
      </Group>

      <Group title="Vitrine de produtos">
        <Field
          label="Linha pequena"
          value={draft.sections.products.eyebrow}
          onChange={(v) =>
            patch((c) => ({
              ...c,
              sections: {
                ...c.sections,
                products: { ...c.sections.products, eyebrow: v },
              },
            }))
          }
        />
        <Field
          label="Título"
          value={draft.sections.products.title}
          onChange={(v) =>
            patch((c) => ({
              ...c,
              sections: {
                ...c.sections,
                products: { ...c.sections.products, title: v },
              },
            }))
          }
        />
        <Field
          label="Texto do botão"
          value={draft.sections.products.ctaLabel}
          onChange={(v) =>
            patch((c) => ({
              ...c,
              sections: {
                ...c.sections,
                products: { ...c.sections.products, ctaLabel: v },
              },
            }))
          }
        />
      </Group>

      <Group title="Preços">
        <Field
          label="Linha pequena"
          value={draft.sections.prices.eyebrow}
          onChange={(v) =>
            patch((c) => ({
              ...c,
              sections: { ...c.sections, prices: { ...c.sections.prices, eyebrow: v } },
            }))
          }
        />
        <Field
          label="Título"
          value={draft.sections.prices.title}
          onChange={(v) =>
            patch((c) => ({
              ...c,
              sections: { ...c.sections, prices: { ...c.sections.prices, title: v } },
            }))
          }
        />
        <Field
          label="Texto explicativo"
          multiline
          value={draft.sections.prices.text ?? ""}
          onChange={(v) =>
            patch((c) => ({
              ...c,
              sections: { ...c.sections, prices: { ...c.sections.prices, text: v } },
            }))
          }
        />
        <Field
          label="Observação abaixo da lista"
          multiline
          hint="Os valores da lista vêm dos produtos — não se escreve preço aqui."
          value={draft.sections.prices.note}
          onChange={(v) =>
            patch((c) => ({
              ...c,
              sections: { ...c.sections, prices: { ...c.sections.prices, note: v } },
            }))
          }
        />
        <Field
          label="Texto do botão"
          value={draft.sections.prices.ctaLabel}
          onChange={(v) =>
            patch((c) => ({
              ...c,
              sections: { ...c.sections, prices: { ...c.sections.prices, ctaLabel: v } },
            }))
          }
        />
      </Group>

      <Group title="Grupo VIP">
        <Field
          label="Linha pequena"
          value={draft.vip.eyebrow}
          onChange={(v) => patch((c) => ({ ...c, vip: { ...c.vip, eyebrow: v } }))}
        />
        <Field
          label="Título"
          value={draft.vip.title}
          onChange={(v) => patch((c) => ({ ...c, vip: { ...c.vip, title: v } }))}
        />
        <Field
          label="Texto"
          multiline
          value={draft.vip.description}
          onChange={(v) =>
            patch((c) => ({ ...c, vip: { ...c.vip, description: v } }))
          }
        />
        <Field
          label="Link do grupo no WhatsApp"
          value={draft.vip.cta.href}
          hint="Cole aqui o convite do grupo. Se ele mudar, é neste campo."
          onChange={(v) =>
            patch((c) => ({ ...c, vip: { ...c.vip, cta: { ...c.vip.cta, href: v } } }))
          }
        />
      </Group>

      <Group title="Avaliações">
        <Field
          label="Nota"
          value={draft.reviews.rating}
          onChange={(v) =>
            patch((c) => ({ ...c, reviews: { ...c.reviews, rating: v } }))
          }
        />
        <Field
          label="Quantidade"
          value={draft.reviews.count}
          onChange={(v) =>
            patch((c) => ({ ...c, reviews: { ...c.reviews, count: v } }))
          }
        />
        {draft.reviews.items.map((review, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Field
              label={`Depoimento ${index + 1}`}
              multiline
              value={review.quote}
              onChange={(v) =>
                patch((c) => ({
                  ...c,
                  reviews: {
                    ...c.reviews,
                    items: c.reviews.items.map((r, i) =>
                      i === index ? { ...r, quote: v } : r,
                    ),
                  },
                }))
              }
            />
            <Field
              label="Quem escreveu"
              value={review.author}
              onChange={(v) =>
                patch((c) => ({
                  ...c,
                  reviews: {
                    ...c.reviews,
                    items: c.reviews.items.map((r, i) =>
                      i === index ? { ...r, author: v } : r,
                    ),
                  },
                }))
              }
            />
          </div>
        ))}
      </Group>

      <Group title="Dados da loja">
        <Field
          label="Título da seção"
          value={draft.sections.visit.title}
          onChange={(v) =>
            patch((c) => ({
              ...c,
              sections: { ...c.sections, visit: { ...c.sections.visit, title: v } },
            }))
          }
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Rua"
            value={draft.store.street}
            onChange={(v) =>
              patch((c) => ({ ...c, store: { ...c.store, street: v } }))
            }
          />
          <Field
            label="Cidade"
            value={draft.store.city}
            onChange={(v) => patch((c) => ({ ...c, store: { ...c.store, city: v } }))}
          />
        </div>
        {draft.store.hours.map((slot, index) => (
          <div key={index} className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <Field
              label={`Dias ${index + 1}`}
              value={slot.days}
              onChange={(v) =>
                patch((c) => ({
                  ...c,
                  store: {
                    ...c.store,
                    hours: c.store.hours.map((h, i) =>
                      i === index ? { ...h, days: v } : h,
                    ),
                  },
                }))
              }
            />
            <Field
              label="Horário"
              value={slot.time}
              onChange={(v) =>
                patch((c) => ({
                  ...c,
                  store: {
                    ...c.store,
                    hours: c.store.hours.map((h, i) =>
                      i === index ? { ...h, time: v } : h,
                    ),
                  },
                }))
              }
            />
          </div>
        ))}
        <Field
          label="Telefone que aparece na tela"
          value={draft.store.phoneLabel}
          onChange={(v) =>
            patch((c) => ({ ...c, store: { ...c.store, phoneLabel: v } }))
          }
        />
        <Field
          label="Instagram"
          value={draft.store.instagramHref}
          onChange={(v) =>
            patch((c) => ({ ...c, store: { ...c.store, instagramHref: v } }))
          }
        />
      </Group>

      {error && (
        <p role="alert" className="text-sm text-foreground-accent">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t border-border-subtle bg-background/95 px-1 py-4 backdrop-blur-sm">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-pill bg-action-primary px-6 py-3.5 text-sm font-medium text-action-primary-foreground transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-action-primary-hover disabled:opacity-50 sm:flex-none"
        >
          {saving ? "Salvando…" : "Salvar textos"}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(defaults);
            setSaved(false);
          }}
          className="rounded-pill border border-border-strong px-6 py-3.5 text-sm transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-surface-inverse hover:text-foreground-inverse"
        >
          Restaurar padrão
        </button>
        {saved && (
          <span className="text-sm text-foreground-accent">
            Salvo. Recarregue o site para ver.
          </span>
        )}
      </div>
    </form>
  );
};
