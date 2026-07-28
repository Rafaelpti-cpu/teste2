-- Catalogue schema for the Supabase backing of the admin area.
--
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query),
-- then create a **public** storage bucket named `product-images`
-- (Dashboard → Storage → New bucket → Public).
--
-- Only the server talks to this table, using the service-role key, so RLS is
-- enabled with no policies: anon and authenticated clients can read nothing,
-- while the service role bypasses RLS entirely. If you later want the public
-- site to read directly from the browser, add a `select` policy for `active`
-- rows — do not disable RLS.

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text        not null unique,
  name        text        not null,
  description text        not null default '',
  price       numeric(10, 2) not null default 0,
  category    text        not null,
  sizes       jsonb       not null default '[]'::jsonb,
  colors      jsonb       not null default '[]'::jsonb,
  images      jsonb       not null default '[]'::jsonb,
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- The public site lists active products newest first.
create index if not exists products_active_created_at_idx
  on public.products (active, created_at desc);

alter table public.products enable row level security;

-- Site copy edited from the admin: one row, one JSON document.
create table if not exists public.site_content (
  id         text primary key,
  data       jsonb       not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

-- Who can sign in to the admin. Passwords are scrypt hashes, never plaintext.
create table if not exists public.admin_users (
  id            uuid primary key,
  email         text        not null unique,
  name          text        not null,
  password_hash text        not null,
  created_at    timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- What happened on the site: one row per page view and per WhatsApp click.
--
-- Deliberately holds nothing personal — no IP, no user agent, no cookie. The
-- `visitor` column is a random id kept in `sessionStorage`, which the browser
-- discards when the tab closes: it separates "three pages in one visit" from
-- "three visits", and identifies nobody. See obsidian/backend/analytics.md.
create table if not exists public.site_events (
  id           uuid primary key default gen_random_uuid(),
  type         text        not null check (type in ('view', 'whatsapp')),
  path         text        not null,
  product_slug text,
  visitor      text        not null,
  created_at   timestamptz not null default now()
);

-- The admin always reads a time window, newest first, and groups in memory.
create index if not exists site_events_created_at_idx
  on public.site_events (created_at desc);

alter table public.site_events enable row level security;
