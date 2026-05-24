# Backupv1.6 — cópia de segurança (Maio 2026)

Ponto de restauração após **correções de Library (troca de livro)** e **remoção de perfis X** no painel Audiopost. Inclui tudo do **Backupv1.5** (Stripe test validado).

## Identificação

| Campo | Valor |
|--------|--------|
| **ID** | `Backupv1.6` |
| **Versão** | `0.1.0` (`package.json`) |
| **Data** | 2026-05-23 |
| **Ficheiros no ZIP** | 447 |
| **Servidor local** | http://localhost:3002 |

## Endereços do backup (Windows)

```
C:\Users\55479\Desktop\EchonX-backups\Backupv1.6\
├── EchonX-full-source.zip
├── EchonX-mirror\
├── MANIFEST.json
└── RESTORE.md
```

## Criar de novo

```powershell
.\scripts\create-phase-backup.ps1 -PhaseId Backupv1.6
```

## O que este backup inclui (vs Backupv1.5)

- **Library player:** troca de livro sem travar; `engineRef.stop()`; cancelamento de fetch; play durante loading.
- **X profiles:** botão **X** na lista do dashboard; `unfollowProfile` + limpeza da fila.
- **Webhook Stripe:** eventos ignorados com 200 antes de abrir Supabase (§31.5 em HTML).
- **Stripe test + Starter** (herdado de v1.5).

## Doc HTML

- §32 — `#atualizacoes-library-xprofiles-maio-2026`
- §33 — `#backup-v1-6`

## Backup anterior

`Backupv1.5` — `C:\Users\55479\Desktop\EchonX-backups\Backupv1.5\`
