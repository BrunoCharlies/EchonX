-- Curator channel: rename slot echonx → news. Slot "echonx" reserved for future platform channel.

alter table public.official_channels drop constraint if exists official_channels_slot_check;

alter table public.official_channels
  add constraint official_channels_slot_check
  check (slot in ('news', 'echonx'));

update public.curator_feed_sources
set channel_slot = 'news'
where channel_slot = 'echonx';

update public.official_channels
set slot = 'news'
where slot = 'echonx';

update public.profiles
set
  username = case when username = 'echonx' and kind = 'curator' then 'news' else username end,
  display_name = case
    when kind = 'curator' and (display_name is null or display_name = 'EchonX') then 'News'
    else display_name
  end,
  name = case when kind = 'curator' and (name is null or name = 'EchonX') then 'News' else name end,
  bio = case
    when kind = 'curator' and (bio is null or bio ilike '%Official EchonX channel%') then
      'Curated headlines from terms-compliant sources. Source links stay in the post; audio skips URLs.'
    else bio
  end,
  owner_x_user_id = case when owner_x_user_id = 'curator:echonx' then 'curator:news' else owner_x_user_id end
where kind = 'curator'
  and (username = 'echonx' or owner_x_user_id = 'curator:echonx');

update public.posts
set external_source = 'news_curator'
where external_source = 'echonx_curator';
