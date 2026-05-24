-- Library Premium — separate from Audiopost subscriptions (Stripe recurring add-on).

do $$
begin
  if not exists (
    select 1 from pg_type
    where typname = 'library_plan_tier' and typnamespace = 'public'::regnamespace
  ) then
    create type public.library_plan_tier as enum (
      'library-starter',
      'library-popular',
      'library-pro'
    );
  end if;
end $$;

create table if not exists public.library_subscriptions (
  owner_x_user_id text primary key,
  plan public.library_plan_tier,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  bytes_consumed bigint not null default 0 check (bytes_consumed >= 0),
  period_byte_quota bigint not null default 0 check (period_byte_quota >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists library_subscriptions_stripe_customer_id_idx
  on public.library_subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

alter table public.library_subscriptions enable row level security;
