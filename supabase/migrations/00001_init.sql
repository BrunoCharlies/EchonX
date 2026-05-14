-- EchonX core schema for Supabase (Postgres)
-- Apply via Supabase SQL editor or `supabase db push` after linking the project.

create extension if not exists "pgcrypto";

create type public.plan_tier as enum ('free', 'starter', 'popular', 'pro');
create type public.profile_kind as enum ('native', 'external_x');

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  owner_x_user_id text not null unique,
  username text not null unique,
  display_name text,
  bio text,
  avatar_path text,
  kind profile_kind not null default 'native',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  image_paths text[] not null default '{}',
  moderation_payload jsonb,
  like_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  liker_x_user_id text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, liker_x_user_id)
);

create table if not exists public.want_to_hear (
  listener_x_user_id text not null,
  target_profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (listener_x_user_id, target_profile_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_x_user_id text not null unique,
  stripe_customer_id text,
  plan plan_tier not null default 'free',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.listening_queue (
  id bigserial primary key,
  listener_x_user_id text not null,
  post_id uuid not null references public.posts (id) on delete cascade,
  reason text not null default 'new_since_subscription',
  created_at timestamptz not null default now()
);

create table if not exists public.audio_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_x_user_id text not null,
  audio_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists posts_author_created_idx on public.posts (author_id, created_at desc);

-- Row level security: tighten write policies once Supabase Auth is mapped to X identities.
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.want_to_hear enable row level security;
alter table public.subscriptions enable row level security;
alter table public.listening_queue enable row level security;
alter table public.audio_comments enable row level security;

create policy "Public read profiles" on public.profiles for select using (true);
create policy "Public read posts" on public.posts for select using (true);
