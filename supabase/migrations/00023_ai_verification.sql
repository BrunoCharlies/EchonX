-- EchonX AI post verification: cache, usage logs, Stripe AI Analysis subscription.

create table if not exists public.post_verifications (
  post_id uuid primary key references public.posts (id) on delete cascade,
  content_hash text not null,
  observation text not null check (char_length(observation) <= 220),
  model text not null default 'gpt-4.1-mini',
  tokens_used integer not null default 0 check (tokens_used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists post_verifications_content_hash_idx
  on public.post_verifications (content_hash);

create table if not exists public.ai_verification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  post_id uuid not null references public.posts (id) on delete cascade,
  tokens_estimated integer not null default 0 check (tokens_estimated >= 0),
  cache_hit boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ai_verification_logs_user_created_idx
  on public.ai_verification_logs (user_id, created_at desc);

create table if not exists public.ai_subscriptions (
  owner_x_user_id text primary key,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_subscriptions_stripe_customer_id_idx
  on public.ai_subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

alter table public.post_verifications enable row level security;
alter table public.ai_verification_logs enable row level security;
alter table public.ai_subscriptions enable row level security;

-- Service role handles writes; no public policies (matches library_subscriptions pattern).
-- Quota: count ai_verification_logs where cache_hit = false (OpenAI only). cache_hit = true = post_verifications read.
