-- Roles, presence, listening queue completion, read analytics, and auto-enqueue trigger.

alter table public.profiles
  add column if not exists role text not null default 'user';

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

do $$
begin
  alter table public.profiles add constraint profiles_role_check check (role in ('user', 'admin'));
exception
  when duplicate_object then null;
end $$;

alter table public.listening_queue
  add column if not exists consumed_at timestamptz;

create unique index if not exists listening_queue_listener_post_uniq
  on public.listening_queue (listener_x_user_id, post_id);

create table if not exists public.text_read_events (
  id bigserial primary key,
  listener_x_user_id text not null,
  post_id uuid not null references public.posts (id) on delete cascade,
  chars_count int not null default 0,
  read_at timestamptz not null default now()
);

create index if not exists text_read_events_read_at_idx on public.text_read_events (read_at desc);

alter table public.text_read_events enable row level security;

-- Auto-enqueue: only posts created after the listener's listening_since for that author.
create or replace function public.enqueue_listeners_on_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.listening_queue (listener_x_user_id, post_id, reason)
  select w.listener_x_user_id, NEW.id, 'new_since_subscription'
  from public.want_to_hear w
  where w.target_profile_id = NEW.author_id
    and NEW.created_at >= w.listening_since
  on conflict (listener_x_user_id, post_id) do nothing;

  return NEW;
end;
$$;

drop trigger if exists trg_posts_enqueue_listeners on public.posts;
create trigger trg_posts_enqueue_listeners
after insert on public.posts
for each row execute procedure public.enqueue_listeners_on_post();

-- Realtime (run in SQL editor if needed):
-- alter publication supabase_realtime add table public.listening_queue;
