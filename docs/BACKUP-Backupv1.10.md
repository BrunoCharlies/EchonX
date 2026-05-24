# Backupv1.10 — cópia de segurança (Maio 2026)

Ponto de restauração após **EchonX AI Context Analysis** (análise contextual por post, Stripe AI $19/mês, cache e limites por chamada OpenAI). Inclui tudo do **Backupv1.9**.

## Identificação

| Campo | Valor |
|--------|--------|
| **ID** | `Backupv1.10` |
| **Versão** | `0.1.0` (`package.json`) |
| **Data** | 2026-05-23 |
| **Ficheiros no ZIP** | 487 |
| **Servidor local** | http://localhost:3002 |

## Endereços do backup (Windows)

```
C:\Users\55479\Desktop\EchonX-backups\Backupv1.10\
├── EchonX-full-source.zip
├── EchonX-mirror\
├── MANIFEST.json
└── RESTORE.md
```

## Criar de novo

```powershell
.\scripts\create-phase-backup.ps1 -PhaseId Backupv1.10
```

## O que este backup inclui (vs Backupv1.9)

- **AI Context Analysis:** botão `AI Context`, painel contextual (não fact-check absoluto), GPT-4.1 mini com prompt neutro, níveis high/moderate/limited.
- **API:** `POST /api/ai/verify-post`, `OPENAI_API_KEY` só no servidor, `analyzePostContextWithOpenAi`.
- **Cache:** `post_verifications` + hash; quota só em `cache_hit = false`; reabertura UI sem API.
- **Billing:** plano AI $19/mês (`STRIPE_PRICE_AI_ANALYSIS`), `ai_subscriptions`, checkout/webhook `ai-analysis`.
- **DB:** migrações `00023_ai_verification.sql`, `00024_ai_context_confidence.sql`.
- **UX:** shimmer “Analyzing context…”, `translate="no"` no widget.
- **Heranço v1.9:** refresh feed, imagens X naturais, Lumos, Explore 4 colunas.

## Doc HTML

- §40 — `#echonx-ai-context-analysis-maio-2026`
- §41 — `#backup-v1-10`

## Backup anterior

`Backupv1.9` — `C:\Users\55479\Desktop\EchonX-backups\Backupv1.9\`
