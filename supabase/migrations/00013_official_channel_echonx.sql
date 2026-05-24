-- Official channels registry (MVP: curated News slot; echonx reserved for platform updates).

-- Add curator to profile_kind enum when present; skip if DB uses text for profiles.kind.
do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'profile_kind'
  ) then
    alter type public.profile_kind add value if not exists 'curator';
  end if;
exception
  when duplicate_object then null;
end $$;

create table if not exists public.official_channels (
  slot text primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  active boolean not null default true,
  ingest_interval_minutes int not null default 120,
  max_posts_per_run int not null default 3,
  updated_at timestamptz not null default now()
);

do $$
begin
  alter table public.official_channels
    add constraint official_channels_slot_check
    check (slot in ('news', 'echonx'));
exception
  when duplicate_object then null;
end $$;

create table if not exists public.curator_feed_sources (
  id uuid primary key default gen_random_uuid(),
  channel_slot text not null references public.official_channels (slot) on delete cascade,
  label text not null,
  feed_url text not null,
  active boolean not null default true,
  last_fetched_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists curator_feed_sources_channel_idx
  on public.curator_feed_sources (channel_slot, active);

alter table public.official_channels enable row level security;
alter table public.curator_feed_sources enable row level security;

drop policy if exists "Public read official channels" on public.official_channels;
create policy "Public read official channels" on public.official_channels
for select using (active = true);

drop policy if exists "Public read active curator feeds" on public.curator_feed_sources;
create policy "Public read active curator feeds" on public.curator_feed_sources
for select using (active = true);
