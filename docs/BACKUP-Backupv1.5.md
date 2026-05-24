# Backupv1.5 — cópia de segurança (Maio 2026)

Ponto de restauração após **validação positiva** do fluxo Stripe (modo test): checkout Audiopost Starter, webhooks `200`, plano ativo na UI (`BCharles` / Starter).

## Identificação

| Campo | Valor |
|--------|--------|
| **ID** | `Backupv1.5` |
| **Versão** | `0.1.0` (`package.json`) |
| **Data** | 2026-05-23 |
| **Ficheiros no ZIP** | 446 |
| **Servidor local** | http://localhost:3002 |

## Endereços do backup (Windows)

```
C:\Users\55479\Desktop\EchonX-backups\Backupv1.5\
├── EchonX-full-source.zip
├── EchonX-mirror\
├── MANIFEST.json
└── RESTORE.md
```

## Restaurar

```powershell
cd C:\Users\55479\Desktop\EchonX
# Extrair ZIP sobre o projeto OU copiar de EchonX-mirror\ (excluir node_modules/.next)
Expand-Archive -Path "C:\Users\55479\Desktop\EchonX-backups\Backupv1.5\EchonX-full-source.zip" -DestinationPath "C:\Users\55479\Desktop\EchonX-restore-temp" -Force
# (ajustar conforme RESTORE.md na pasta do backup)
npm install
npx supabase db push
npm run stripe:use-test
npm run dev:clean
```

Ver `C:\Users\55479\Desktop\EchonX-backups\Backupv1.5\RESTORE.md`.

## Criar de novo

```powershell
.\scripts\create-phase-backup.ps1 -PhaseId Backupv1.5
```

## O que este backup inclui (vs Backupv1.4)

- **Stripe Audiopost:** `POST /api/billing/checkout`, webhook `POST /api/webhooks/stripe` (eventos filtrados + sync Supabase).
- **Stripe Library:** `POST /api/billing/library/checkout`, `library-stripe-sync.ts`, quota Fish (`/api/library/tts`).
- **Migrações Supabase:** `00020_stripe_subscription_id`, `00021_library_subscriptions`, `00022_library_bytes_increment`.
- **Env test/live:** `env/stripe.test.env`, `env/stripe.live.env`, `npm run stripe:use-test|live`, `scripts/apply-stripe-env.mjs`.
- **Docs:** `docs/STRIPE-SETUP.md`, `docs/STRIPE-ENV-SWITCH.md`, `docs/LIBRARY-BILLING.md`, HTML §30 + **§31 Backupv1.5**.
- **Teste validado:** `stripe listen` + checkout `4242…` → webhooks `200` → plano Starter na app.

## Backup anterior

`Backupv1.4` — `C:\Users\55479\Desktop\EchonX-backups\Backupv1.4\` · `docs/BACKUP-Backupv1.4.md`
