-- Once a queue row is consumed, application sync must not clear consumed_at (repeat TTS / queue).

create or replace function public.listening_queue_preserve_consumed_at()
returns trigger
language plpgsql
as $$
begin
  if old.consumed_at is not null and new.consumed_at is null then
    new.consumed_at := old.consumed_at;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_listening_queue_preserve_consumed on public.listening_queue;
create trigger trg_listening_queue_preserve_consumed
  before update on public.listening_queue
  for each row
  execute procedure public.listening_queue_preserve_consumed_at();
