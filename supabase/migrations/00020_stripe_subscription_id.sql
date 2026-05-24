-- Stripe subscription id for webhook sync and customer portal.

alter table public.subscriptions
  add column if not exists stripe_subscription_id text;

create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;
