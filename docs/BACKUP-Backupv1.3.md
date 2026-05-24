# Backupv1.3 — cópia de segurança (Maio 2026)

Ponto de restauração após **painel admin reorganizado**, **correções de fila/player** e refinamentos da **Library bar**.

## Identificação

| Campo | Valor |
|--------|--------|
| **ID** | `Backupv1.3` |
| **Versão** | `0.1.0` (`package.json`) |
| **Data** | 2026-05-22 |
| **Ficheiros no ZIP** | 404 |
| **Servidor local** | http://localhost:3002 |

## Endereços do backup (Windows)

```
C:\Users\55479\Desktop\EchonX-backups\Backupv1.3\
├── EchonX-full-source.zip
├── EchonX-mirror\            (cópia espelho — restore rápido)
├── MANIFEST.json
└── RESTORE.md
```

**Não apague** a pasta `EchonX-backups` no Desktop.

## O que este backup inclui (vs Backupv1.2)

- **Admin** — `src/app/admin/admin-shell.css`, layout compacto, estatísticas no topo, badge ADMIN
- **Cards de canal** — `official-channel-admin.tsx`, `qubic-channel-admin.tsx` (cabeçalho em coluna, botões abaixo)
- **Métricas admin** — rótulos de período (7 dias, 2 min, UTC); API `/api/admin/metrics` inalterada
- **Correções Audiopost** — skip profile sem reabrir autores; skip profile consome fila; timeline 6 h (texto)
- **Fila** — `GET /api/listening/queue` exige migração `00019` (sem retry que reimportava tudo)
- **Segurança** — `POST /api/moderate-image` exige sessão
- **PDF reader** — para voz quando Audiopost assume playback
- Tudo do **Backupv1.2** (Library volume/equalizer, §29, logo Explore, etc.)

## O que não inclui

- `node_modules`, `.next`, `.next-dev`
- `.env.local` — **guarde cópia à parte** antes de restaurar

## Criar de novo este backup

```powershell
cd C:\Users\55479\Desktop\EchonX
.\scripts\create-phase-backup.ps1 -PhaseId Backupv1.3
```

## Restaurar

Ver `C:\Users\55479\Desktop\EchonX-backups\Backupv1.3\RESTORE.md` ou:

```powershell
.\scripts\restore-phase-backup.ps1 -Phase Backupv1.3
npm install
npx supabase db push
npm run dev:clean
```

## Backup anterior

`Backupv1.2` — `docs/BACKUP-Backupv1.2.md` · HTML `#backup-v1-2`
