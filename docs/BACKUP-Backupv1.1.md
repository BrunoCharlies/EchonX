# Backupv1.1 — cópia de segurança (Maio 2026)

Ponto de restauração após **voz Fish (lab)**, **bloqueio de fila consumida**, **pt-BR**, **admin add X** e documentação **§28**.

## Identificação

| Campo | Valor |
|--------|--------|
| **ID** | `Backupv1.1` |
| **Versão** | `0.1.0` (`package.json`) |
| **Data** | 2026-05-21 |
| **Ficheiros no ZIP** | 395 |
| **Servidor local** | http://localhost:3002 |

## Endereços do backup (Windows)

```
C:\Users\55479\Desktop\EchonX-backups\Backupv1.1\
├── EchonX-full-source.zip
├── EchonX-mirror\            (cópia espelho — restore rápido)
├── MANIFEST.json
└── RESTORE.md
```

**Não apague** a pasta `EchonX-backups` no Desktop.

## O que este backup inclui (vs Backupv1.0)

- §28 HTML + `public/docs/html/` sincronizado
- `src/lib/listening/queue-enqueue.ts` — não reabre posts consumidos no sync X
- `supabase/migrations/00019_listening_queue_no_unconsume.sql`
- `src/lib/voice/speech-locale.ts`, Fish lab, visor `nowPlayingItem`
- Admin: `canAddCustomExternalXAccountsForUser` em `entitlements.ts`
- Rotas e componentes Audiopost / admin lab (inalterados em relação à v1.0, mais ficheiros)

## O que não inclui

- `node_modules`, `.next`, `.next-dev`
- `.env.local` — **guarde cópia à parte** antes de restaurar

## Criar de novo este backup

```powershell
cd C:\Users\55479\Desktop\EchonX
.\scripts\create-phase-backup.ps1 -PhaseId Backupv1.1
```

## Restaurar

Ver `C:\Users\55479\Desktop\EchonX-backups\Backupv1.1\RESTORE.md` ou:

```powershell
.\scripts\restore-phase-backup.ps1 -Phase Backupv1.1
npm install
npx supabase db push
npm run dev:clean
```

## Backup anterior

`Backupv1.0` — `docs/BACKUP-Backupv1.0.md` · HTML §25 `#backup-v1`
