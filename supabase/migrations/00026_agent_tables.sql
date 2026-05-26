-- EchonX autonomous X agent (Phase 1) — service role only

create table if not exists public.agent_posts (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  posted_to_x boolean not null default false,
  x_post_id text,
  status text not null default 'draft'
    check (status in ('draft', 'posted', 'failed', 'skipped')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists agent_posts_created_at_idx on public.agent_posts (created_at desc);
create index if not exists agent_posts_status_idx on public.agent_posts (status);

create table if not exists public.agent_mentions (
  id uuid primary key default gen_random_uuid(),
  x_mention_id text not null unique,
  username text,
  content text not null,
  mention_type text,
  replied boolean not null default false,
  reply_post_id text,
  reply_content text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists agent_mentions_replied_idx on public.agent_mentions (replied, created_at desc);

create table if not exists public.agent_memory (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'general',
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists agent_memory_category_created_idx
  on public.agent_memory (category, created_at desc);

create table if not exists public.agent_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.agent_settings (key, value)
values
  ('agent_enabled', 'false'),
  ('last_mention_since_id', ''),
  ('last_autonomous_post_at', '')
on conflict (key) do nothing;

alter table public.agent_posts enable row level security;
alter table public.agent_mentions enable row level security;
alter table public.agent_memory enable row level security;
alter table public.agent_settings enable row level security;
