-- Likes: create missing tables (safe if 00001/00011 were never applied), then RLS + auto like_count sync.

-- Requires public.posts (from core schema). If this fails, run supabase/migrations/00001_init.sql first.
create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  liker_x_user_id text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, liker_x_user_id)
);

alter table public.posts
  add column if not exists like_count int not null default 0;

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  parent_comment_id uuid references public.post_comments (id) on delete cascade,
  author_profile_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  like_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.post_comments
  add column if not exists like_count int not null default 0;

create table if not exists public.post_comment_likes (
  comment_id uuid not null references public.post_comments (id) on delete cascade,
  liker_x_user_id text not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, liker_x_user_id)
);

alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_comment_likes enable row level security;

drop policy if exists "Public read post comments" on public.post_comments;
create policy "Public read post comments" on public.post_comments
  for select using (true);

drop policy if exists "Public read post comment likes" on public.post_comment_likes;
create policy "Public read post comment likes" on public.post_comment_likes
  for select using (true);

drop policy if exists "Public read post likes" on public.post_likes;
create policy "Public read post likes" on public.post_likes
  for select using (true);

drop policy if exists "Users insert own post likes" on public.post_likes;
create policy "Users insert own post likes" on public.post_likes
  for insert to authenticated
  with check (liker_x_user_id = auth.uid()::text);

drop policy if exists "Users delete own post likes" on public.post_likes;
create policy "Users delete own post likes" on public.post_likes
  for delete to authenticated
  using (liker_x_user_id = auth.uid()::text);

drop policy if exists "Users insert own comment likes" on public.post_comment_likes;
create policy "Users insert own comment likes" on public.post_comment_likes
  for insert to authenticated
  with check (liker_x_user_id = auth.uid()::text);

drop policy if exists "Users delete own comment likes" on public.post_comment_likes;
create policy "Users delete own comment likes" on public.post_comment_likes
  for delete to authenticated
  using (liker_x_user_id = auth.uid()::text);

create or replace function public.sync_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post_id uuid;
begin
  target_post_id := coalesce(new.post_id, old.post_id);
  update public.posts
  set like_count = (
    select count(*)::int from public.post_likes where post_id = target_post_id
  )
  where id = target_post_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists post_likes_sync_count on public.post_likes;
create trigger post_likes_sync_count
after insert or delete on public.post_likes
for each row execute function public.sync_post_like_count();

create or replace function public.sync_post_comment_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_comment_id uuid;
begin
  target_comment_id := coalesce(new.comment_id, old.comment_id);
  update public.post_comments
  set like_count = (
    select count(*)::int from public.post_comment_likes where comment_id = target_comment_id
  )
  where id = target_comment_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists post_comment_likes_sync_count on public.post_comment_likes;
create trigger post_comment_likes_sync_count
after insert or delete on public.post_comment_likes
for each row execute function public.sync_post_comment_like_count();
