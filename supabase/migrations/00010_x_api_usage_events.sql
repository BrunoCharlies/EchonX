create table if not exists public.x_api_usage_events (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  listener_x_user_id text,
  target_profile_id uuid,
  x_user_id text,
  endpoint text not null,
  source text not null,
  requested_interval_ms integer,
  imported_count integer not null default 0,
  ok boolean not null default true,
  status_code integer,
  error_message text
);

create index if not exists x_api_usage_events_created_at_idx
  on public.x_api_usage_events (created_at desc);

create index if not exists x_api_usage_events_source_created_at_idx
  on public.x_api_usage_events (source, created_at desc);

create index if not exists x_api_usage_events_profile_created_at_idx
  on public.x_api_usage_events (target_profile_id, created_at desc);
