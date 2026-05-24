-- Context analysis: confidence signal (not absolute verification).

alter table public.post_verifications
  add column if not exists confidence_level text
  check (confidence_level is null or confidence_level in ('high', 'moderate', 'limited'));

update public.post_verifications
set confidence_level = 'moderate'
where confidence_level is null;
