-- Top Audiopost leaderboard (aggregates text_read_events).

create index if not exists text_read_events_post_id_idx on public.text_read_events (post_id);

create or replace function public.get_top_audioposts(p_limit int default 10)
returns table (
  post_id uuid,
  play_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select e.post_id, count(*)::bigint as play_count
  from public.text_read_events e
  group by e.post_id
  order by play_count desc, max(e.read_at) desc
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

revoke all on function public.get_top_audioposts(int) from public;
grant execute on function public.get_top_audioposts(int) to service_role;
