-- Global recommended reading item for the Audiopost mini library.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recommended-documents',
  'recommended-documents',
  true,
  26214400,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read recommended documents" on storage.objects;
create policy "Public read recommended documents" on storage.objects
for select using (bucket_id = 'recommended-documents');

create table if not exists public.app_recommendations (
  slot text primary key,
  title text not null,
  author text,
  description text,
  cover_url text,
  cover_path text,
  document_url text not null,
  document_path text not null,
  document_type text not null default 'pdf',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

do $$
begin
  alter table public.app_recommendations
    add constraint app_recommendations_slot_check
    check (slot in ('echonx_pick'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.app_recommendations
    add constraint app_recommendations_document_type_check
    check (document_type in ('pdf', 'text'));
exception
  when duplicate_object then null;
end $$;

alter table public.app_recommendations enable row level security;

drop policy if exists "Public read active recommendations" on public.app_recommendations;
create policy "Public read active recommendations" on public.app_recommendations
for select using (active = true);
