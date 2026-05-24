-- Allow imported/external X profiles to live in public.profiles without an auth.users row.
--
-- Native signed-in users should still use profiles.id = auth.users.id; that invariant is
-- enforced by the app/auth trigger. External X profiles are not login accounts, so their
-- profile UUID must not be constrained to auth.users.

alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.profiles
  alter column id set default gen_random_uuid();
