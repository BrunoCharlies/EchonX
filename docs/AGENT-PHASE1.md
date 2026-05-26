# EchonX Agent — Phase 1 (X)

Autonomous social agent: posts on X, replies to mentions, memory in Supabase, driven by OpenAI + Vercel Cron.

## Backup before changes

**Backupv1.15** — `C:\Users\55479\Desktop\EchonX-backups\Backupv1.15\`

## Enable (production)

1. Run migration `supabase/migrations/00026_agent_tables.sql` in Supabase SQL Editor.
2. Set Vercel env:
   - `OPENAI_API_KEY`
   - `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`
   - `AGENT_X_USER_ID` (numeric X user id for the bot account)
   - `CRON_SECRET`
   - `AGENT_ENABLED=true` (or `agent_enabled` = `true` in `agent_settings`)
3. Redeploy.

## Cron routes (Vercel)

| Path | Schedule | Action |
|------|----------|--------|
| `/api/agent/cron-post` | Every 4 hours | One autonomous post |
| `/api/agent/cron-mentions` | Every 10 minutes | Fetch + reply mentions |

Auth: `Authorization: Bearer <CRON_SECRET>` (Vercel Cron sends this automatically when configured).

## Manual triggers (admin)

- `POST /api/agent/post` — force one post (admin session or CRON_SECRET)
- `POST /api/agent/mentions` — force mention cycle

## Temporary: resolve `AGENT_X_USER_ID` (@echonagent)

`GET /api/agent/me` — uses **only** `X_API_KEY` / `X_ACCESS_*` (not `X_BEARER_TOKEN`).

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://echonx.app/api/agent/me
```

Copy `hint.agent_x_user_id` → Vercel `AGENT_X_USER_ID`. Remove this route after setup.

## Safety defaults

- `agent_enabled` defaults to **false** in DB.
- `AGENT_ENABLED=false` in env blocks all runs.
- No posts until you explicitly enable.

## Code layout

`src/lib/agent/` — personality, prompts, openai, x-client, posting, mentions, memory, context, config

`src/app/api/agent/` — cron + manual routes
