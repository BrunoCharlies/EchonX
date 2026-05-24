-- External X listening support.
-- External X profiles reuse public.profiles(kind = 'external_x') and imported tweets reuse public.posts.

alter table public.posts
  add column if not exists external_source text;

alter table public.posts
  add column if not exists external_id text;

alter table public.posts
  add column if not exists external_url text;

create unique index if not exists posts_external_source_id_key
  on public.posts (external_source, external_id)
  where external_source is not null and external_id is not null;

create index if not exists profiles_external_x_owner_idx
  on public.profiles (owner_x_user_id)
  where kind = 'external_x';
