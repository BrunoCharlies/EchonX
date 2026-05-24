# Native Audiopost queue + speech limit (May 2026)

This document records product rules implemented in code so we can revert or adjust later.

## Product rules

1. **Native posts enter the listening queue only for users who follow the author** (`want_to_hear`).
2. **Only posts created after `listening_since`** are auto-queued (no backfill of old posts when following).
3. **Speech playback** strips URLs/emails/domains and reads at most **220 characters** per post.
4. **Post body on screen** can still be up to 500 characters (with links visible); audio uses the prepared speech text only.
5. **Official News channel** (`news` slot): same queue rules — see `2026-05-official-channel-echonx-mvp.md`.

## Code changes

| Area | Before | After |
|------|--------|-------|
| `src/server/actions/posts.ts` | `enqueueNativePostForAudiopost()` queued author + all followers on every native insert | Removed; rely on DB trigger `enqueue_listeners_on_post` |
| `src/server/actions/listen.ts` | On follow, upserted up to 50 historical posts into `listening_queue` | Follow only sets `listening_since`; new posts enqueue via trigger |
| `src/lib/voice/speech-text.ts` | (new) | `MAX_AUDIOPOST_SPEECH_CHARS = 220`, strip + truncate |
| `src/lib/voice/voice-engine.ts` | Inline strip only | Uses `prepareTextForSpeech` from `speech-text.ts` |

## Database (unchanged)

Trigger `trg_posts_enqueue_listeners` on `posts` INSERT:

- Inserts into `listening_queue` when `want_to_hear.target_profile_id = NEW.author_id`
- And `NEW.created_at >= want_to_hear.listening_since`

## Rollback

1. Restore `enqueueNativePostForAudiopost` in `posts.ts` and call it after `createPost`.
2. Restore the 50-post backfill block in `toggleWantToHear` (`listen.ts`).
3. Revert `voice-engine.ts` to inline `prepareTextForSpeech` without truncation (or raise `MAX_AUDIOPOST_SPEECH_CHARS`).
4. Delete or ignore `src/lib/voice/speech-text.ts` if unused.

## Not changed in this pass

- **X (Twitter) profiles**: adding an X profile may still import recent tweets into the queue (`x-listening.ts`). Native rules above apply only to `kind = native` posts without relying on that import path.

## Related roadmap (not implemented yet)

- News official curator profile + RSS ingest (`@news`)
- Per-post `audio_body` field for curators vs humans
