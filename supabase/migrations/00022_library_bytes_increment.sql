-- Atomic byte usage counter for Library Fish TTS.

create or replace function public.increment_library_bytes_consumed(
  p_owner_x_user_id text,
  p_delta bigint
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new bigint;
begin
  if p_delta is null or p_delta < 0 then
    raise exception 'invalid_byte_delta';
  end if;

  update public.library_subscriptions
  set
    bytes_consumed = bytes_consumed + p_delta,
    updated_at = now()
  where owner_x_user_id = p_owner_x_user_id
  returning bytes_consumed into v_new;

  if not found then
    return 0;
  end if;

  return v_new;
end;
$$;
