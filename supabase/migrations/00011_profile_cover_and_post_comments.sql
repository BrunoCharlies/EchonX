alter table public.profiles
  add column if not exists cover_path text;

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

create index if not exists post_comments_post_created_idx
  on public.post_comments (post_id, created_at asc);

create index if not exists post_comments_parent_created_idx
  on public.post_comments (parent_comment_id, created_at asc);

alter table public.post_comments enable row level security;

drop policy if exists "Public read post comments" on public.post_comments;
create policy "Public read post comments" on public.post_comments
  for select using (true);

create table if not exists public.post_comment_likes (
  comment_id uuid not null references public.post_comments (id) on delete cascade,
  liker_x_user_id text not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, liker_x_user_id)
);

alter table public.post_comment_likes enable row level security;

drop policy if exists "Public read post comment likes" on public.post_comment_likes;
create policy "Public read post comment likes" on public.post_comment_likes
  for select using (true);
