# EchonX Agent — Phase 1 (X)

Autonomous social agent: posts on X, replies to mentions, memory in Supabase, driven by OpenAI + Vercel Cron.

**Status (Maio 2026):** em produção — @echonagent responde menções; ver documentação HTML §51.

## Documentation

| Recurso | Caminho |
|---------|---------|
| HTML (operacional + playbook) | `/docs/html/2026-05-qubic-echonx-moeda-assinatura.html#echonx-agent-maio-2026` |
| Playbook (fonte Git) | `content/agent/playbook.md` |
| Playbook (HTML) | `#agent-playbook-full` na mesma página |
| Índice | `/docs/html/echonx-explicacoes-index.html` |

## Backup before changes

**Backupv1.15** — `C:\Users\55479\Desktop\EchonX-backups\Backupv1.15\`

## Enable (production)

1. Run migration `supabase/migrations/00026_agent_tables.sql` in Supabase SQL Editor.
2. Set Vercel env:
   - `OPENAI_API_KEY`
   - `AGENT_X_API_KEY`, `AGENT_X_API_SECRET`, `AGENT_X_ACCESS_TOKEN`, `AGENT_X_ACCESS_SECRET`
   - `AGENT_X_USER_ID` (numeric X user id for the bot account)
   - `CRON_SECRET`
   - `AGENT_ENABLED=true` (or `agent_enabled` = `true` in `agent_settings`)
3. Redeploy.

## Cron routes (Vercel)

| Path | Schedule | Action |
|------|----------|--------|
| `/api/agent/cron-post` | Every 4 hours | One autonomous post |
| `/api/agent/cron-mentions` | Every 2 minutes | Fetch + reply mentions |

Auth: `Authorization: Bearer <CRON_SECRET>` (Vercel Cron sends this automatically when configured).

## Manual triggers (admin)

- `POST /api/agent/post` — force one post (admin session or CRON_SECRET)
- `POST /api/agent/mentions` — force mention cycle

## Temporary: resolve `AGENT_X_USER_ID` (@echonagent)

`GET /api/agent/me` — uses **only** `AGENT_X_*` OAuth vars (not `X_BEARER_TOKEN` for import).

**Temporarily open (no auth)** for internal validation — re-secure before leaving in production.

```bash
curl https://echonx.app/api/agent/me
```

Copy `hint.agent_x_user_id` → Vercel `AGENT_X_USER_ID`. Remove this route after setup.

## Safety defaults

- `agent_enabled` defaults to **false** in DB.
- `AGENT_ENABLED=false` in env blocks all runs.
- No posts until you explicitly enable.

## Agent playbook (knowledge base)

Edit `content/agent/playbook.md` (Markdown, versioned in Git). Loaded on every post/mention via `getAgentContext()`. Redeploy after changes. HTML mirror: §51.7 in project docs.

## Branding (code constants)

`src/lib/agent/brand.ts` — `@echonxapp`, `#Aigarth`, 2027 estimate framing.

## Code layout

`src/lib/agent/` — personality, prompts, playbook loader, openai, x-client, posting, mentions, memory, context, config, brand

`src/app/api/agent/` — cron + manual routes
