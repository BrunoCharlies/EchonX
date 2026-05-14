-- Storage buckets + listening_since + realtime publication (best-effort)

alter table public.want_to_hear
  add column if not exists listening_since timestamptz not null default now();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    true,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'post-images',
    'post-images',
    true,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public reads for mobile/PWA clients pulling CDN objects directly.
drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars" on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "Public read post images" on storage.objects;
create policy "Public read post images" on storage.objects for select using (bucket_id = 'post-images');

-- If Realtime is not enabled for `posts` yet, run in the Supabase SQL editor:
-- alter publication supabase_realtime add table public.posts;
