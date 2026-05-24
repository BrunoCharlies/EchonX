# Official Qubic channel — X mirror (`qubic` slot)

**Status:** Implemented (May 2026). Apply migration `00015_qubic_official_channel.sql` in Supabase.

## Product (exception)

- **Only** EchonX channel allowed to import X posts into the **public** feed.
- Profile behaves like a **native/curator** channel: Explore, follow (`want_to_hear`), queue via DB trigger after `listening_since`.
- **Free** to follow and listen (does not consume paid “external X profile” slots).
- Source of truth on X: **[@_Qubic_](https://x.com/_Qubic_)**

## Identifiers

| Field | Value |
|-------|--------|
| X handle (display) | `@_Qubic_` |
| X API username | `_qubic_` (normalized in `sanitizeXHandle`) |
| EchonX slot | `qubic` |
| EchonX public @ | `qubic` |
| `profiles.owner_x_user_id` | `curator:qubic` |
| `profiles.kind` | `curator` (not `external_x`) |
| `posts.external_source` | `qubic_x` |
| Code constants | `src/lib/curator/constants.ts` |

## Architecture (implemented)

| Path | Role |
|------|------|
| `src/lib/curator/qubic-ingest.ts` | Ensure channel, `runQubicOfficialXIngest()` |
| `src/lib/curator/official-profiles.ts` | Badge labels, free-follow helpers, reserved X handle |
| `src/server/actions/official-channel-qubic.ts` | Admin save + ingest |
| `src/app/api/admin/qubic-ingest/route.ts` | Manual sync (admin) |
| `src/app/api/cron/qubic-x-ingest/route.ts` | Cron sync (`CRON_SECRET`) |
| `src/components/app/qubic-channel-admin.tsx` | Admin UI |

1. Migration `00015`: slot `qubic` in `official_channels_slot_check`.
2. Ingest: `getXUserByUsername(_qubic_)` → `getLatestXPosts` → one `posts` row per tweet (`external_source: qubic_x`).
3. Queue: DB trigger `trg_posts_enqueue_listeners` (no per-listener X import).
4. Explore: `kind = curator`; badge “Qubic” via `OfficialChannelBadge`.
5. Adding `@_Qubic_` in “X profile to hear” redirects to official `@qubic` follow (free).
6. **X photos:** ingest requests `attachments` + `media` from API v2; downloads from `pbs.twimg.com` (etc.), moderates, stores in `post-images` under `qubic-x/{postId}/`. **If import succeeds → only X photos (no OG card). If no photo → OG card only.** Backfill strips cards from posts that already had both. Other X profiles unchanged (card only).

## Database prerequisite

Extend slot check (today: `news`, `echonx` only):

```sql
alter table public.official_channels drop constraint if exists official_channels_slot_check;
alter table public.official_channels
  add constraint official_channels_slot_check
  check (slot in ('news', 'echonx', 'qubic'));
```

## Legal / ops

- Requires valid `X_BEARER_TOKEN` and compliance with X developer display rules.
- Attribution: keep `external_url` to `https://x.com/_Qubic_/status/{id}` in post body or metadata.

## Related

- News RSS curator: `docs/decisions/2026-05-official-channel-echonx-mvp.md`
- Queue rules: `docs/decisions/2026-05-native-audiopost-queue.md`
- Generic X listening (per-user, not Explore): `src/server/actions/x-listening.ts`
