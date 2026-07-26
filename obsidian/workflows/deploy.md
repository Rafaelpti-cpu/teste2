---
tags: [workflow, deploy, stable]
updated: 2026-07-26
---

# Deploy — colocar o site no ar

Alvo: **Vercel** (site) + **Supabase** (banco e fotos novas). Os dois têm plano
gratuito suficiente para uma loja deste tamanho.

> [!warning] O Supabase não é opcional na Vercel
> A Vercel roda com disco somente-leitura. O armazenamento em arquivo
> (`.data/`, gravar em `public/`) **falha lá** — é exatamente para isso que a
> outra implementação existe. Sem as variáveis do Supabase, o admin não
> consegue salvar nada em produção. Ver [[catalog-store]].

## 1. Supabase (10 minutos)

1. Criar projeto em [supabase.com](https://supabase.com) — região **South
   America (São Paulo)** deixa o site mais rápido para o público da loja.
2. **SQL Editor → New query** → colar o conteúdo de `supabase/schema.sql` → Run.
   Cria as tabelas `products` e `site_content`.
3. **Storage → New bucket** → nome `product-images` → marcar **Public**.
   É onde as fotos enviadas pelo admin vão parar.
4. **Project Settings → API** → anotar:
   - `Project URL` → vira `SUPABASE_URL`
   - `service_role` (em *Project API keys*, precisa revelar) → vira
     `SUPABASE_SERVICE_ROLE_KEY`

> [!danger] A chave `service_role` ignora as regras de segurança do banco
> Ela só pode existir no servidor. Nunca com prefixo `NEXT_PUBLIC_`, nunca
> commitada, nunca colada num canal público. Se vazar, é rotacionar no painel.

## 2. GitHub

O repositório já existe (`Rafaelpti-cpu/teste2`). Commitar e enviar:

```
git add -A
git commit -m "feat: site da Renova Closet"
git push
```

O que **não** vai junto, de propósito: `.data/` (o catálogo local) e `.env*`.
As fotos importadas em `public/assets/produtos/` **vão** — são servidas como
arquivo estático e continuam funcionando na Vercel.

## 3. Vercel

1. [vercel.com/new](https://vercel.com/new) → importar o repositório.
2. Framework: Next.js (detecta sozinho). Não mexer em build command.
3. **Environment Variables** — antes do primeiro deploy:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | o endereço final, sem barra no fim |
| `SUPABASE_URL` | Project URL do passo 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | chave `service_role` do passo 1 |
| `SUPABASE_STORAGE_BUCKET` | `product-images` |
| `ADMIN_PASSWORD` | a senha do admin |

4. Deploy.

## 4. Primeira visita

A primeira vez que a home carrega, o catálogo é plantado no Supabase a partir de
`src/data/catalog-seed.ts` — 40 peças com fotos, tamanhos e cores. É o mesmo
comportamento do armazenamento em arquivo, e roda uma vez só.

Conferir depois do deploy:

- `/` mostra as 40 peças
- `/admin` pede senha
- `/sitemap.xml` lista as peças
- Mandar o link de uma peça no WhatsApp e ver se a **prévia com a foto**
  aparece — se não aparecer, `NEXT_PUBLIC_SITE_URL` está errada ou faltando

## Domínio próprio

Vercel → Settings → Domains → adicionar `renovacloset.com` e seguir as
instruções de DNS. Depois **atualizar `NEXT_PUBLIC_SITE_URL`** para o domínio
novo e refazer o deploy, senão os links do WhatsApp continuam apontando para o
endereço `.vercel.app`.

## De onde vem cada foto depois do deploy

| Origem | Onde mora | Observação |
|---|---|---|
| As 40 peças importadas | no repositório, `public/assets/produtos/` | servidas pela Vercel |
| Qualquer foto nova pelo admin | Supabase Storage | `next.config.ts` já libera `*.supabase.co` |

Os dois convivem — não é preciso migrar as antigas.

## Related

[[catalog-store]] · [[admin-area]] · [[site-content]] · [[environment-variables]]
