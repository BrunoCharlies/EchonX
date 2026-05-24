# Official channels — News curator (`news` slot)

Curated RSS headlines use the **News** channel. The **`echonx`** slot is reserved for a future platform channel (product updates, launches)—not RSS ingest in this MVP.

## Product rules

| Rule | Implementation |
|------|----------------|
| News channel | Display **News**, default `@news`, slot `news` |
| Posts in Explore | `external_source` in `news_curator` (legacy `echonx_curator` still shown) |
| Source link in post | `external_url` + line in `body` |
| Links not read in audio | `prepareTextForSpeech` in `speech-text.ts` |
| Max audio length | 220 chars (`MAX_AUDIOPOST_SPEECH_CHARS`) |
| Queue | DB trigger `enqueue_listeners_on_post` + `listening_since` only |
| Follow to hear | `want_to_hear` on `@news` profile |
| Platform channel (later) | Slot `echonx` — manual/native posts only, no RSS |

## Database

- `00013_official_channel_echonx.sql` — tables + slots `news`, `echonx`
- `00014_official_channel_news_slot.sql` — migrate existing `echonx` curator data → `news`

**Apply in Supabase SQL editor** if not using `supabase db push`.

## Code map

| Path | Role |
|------|------|
| `src/lib/curator/constants.ts` | Slot, username, external_source keys |
| `src/lib/curator/rss.ts` | Fetch/parse RSS |
| `src/lib/curator/post-body.ts` | Post text (≤500 chars) with source line |
| `src/lib/curator/ingest.ts` | Ensure profile/channel, run ingest |
| `src/server/actions/official-channel.ts` | Admin save + ingest action |
| `src/app/api/admin/curator-ingest/route.ts` | Manual publish (admin) |
| `src/app/api/cron/curator-ingest/route.ts` | Cron publish (`CRON_SECRET`) |
| `src/components/app/official-channel-admin.tsx` | Admin UI |
| `src/components/profile/official-channel-badge.tsx` | “News” badge |

## Admin setup

1. Run migrations `00013` and `00014`
2. Open **Admin** → **Official channel — News**
3. Add RSS sources (publisher terms-compliant)
4. Click **Publish now** or schedule cron:

```http
POST /api/cron/curator-ingest
Authorization: Bearer <CRON_SECRET>
```

5. Optional: set `CRON_SECRET` in `.env.local`

## Replicating more channels later

1. Add slot to `official_channels_slot_check`
2. Duplicate pattern: new slot constant, admin row, feeds, badge label
3. Explore filter: extend `EXPLORE_CURATOR_EXTERNAL_SOURCES` or filter by `profile.kind = curator`

## Rollback

1. Revert migration tables (drop `curator_feed_sources`, `official_channels`; remove enum value only if unused)
2. Remove curator posts: `delete from posts where external_source in ('news_curator', 'echonx_curator')`
3. Revert code paths listed above
4. Restore Explore filter to `.is('external_source', null)` only

See also: `docs/decisions/2026-05-native-audiopost-queue.md`
