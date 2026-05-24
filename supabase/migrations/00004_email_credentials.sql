-- Email + password credentials (NextAuth Credentials provider). Access only via service role from the app server.

create table if not exists public.email_credentials (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  email text not null,
  password_hash text not null,
  reset_token_hash text,
  reset_token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists email_credentials_email_lower_key
  on public.email_credentials (lower(trim(email)));

alter table public.email_credentials enable row level security;
