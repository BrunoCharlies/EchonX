-- Repair: subscriptions table missing on some projects (PGRST205 on settings/billing).
-- Safe to run multiple times.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'plan_tier' and typnamespace = 'public'::regnamespace) then
    create type public.plan_tier as enum ('free', 'starter', 'popular', 'pro');
  end if;
end $$;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_x_user_id text not null unique,
  stripe_customer_id text,
  plan public.plan_tier not null default 'free',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- One free row per native account owner (owner_x_user_id = auth user id).
insert into public.subscriptions (owner_x_user_id, plan)
select distinct p.owner_x_user_id, 'free'::public.plan_tier
from public.profiles p
where p.kind = 'native'
  and p.owner_x_user_id is not null
  and length(trim(p.owner_x_user_id)) > 0
on conflict (owner_x_user_id) do nothing;
