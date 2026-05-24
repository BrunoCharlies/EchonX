# Backupv1.4 — cópia de segurança (Maio 2026)

Ponto de restauração **antes do próximo ciclo de alterações** — estado estável com tudo do Backupv1.3.

## Identificação

| Campo | Valor |
|--------|--------|
| **ID** | `Backupv1.4` |
| **Versão** | `0.1.0` (`package.json`) |
| **Data** | 2026-05-22 |
| **Ficheiros no ZIP** | 405 |
| **Servidor local** | http://localhost:3002 |

## Endereços do backup (Windows)

```
C:\Users\55479\Desktop\EchonX-backups\Backupv1.4\
├── EchonX-full-source.zip
├── EchonX-mirror\
├── MANIFEST.json
└── RESTORE.md
```

## Restaurar

```powershell
cd C:\Users\55479\Desktop\EchonX
.\scripts\restore-phase-backup.ps1 -Phase Backupv1.4
npm install
npx supabase db push
npm run dev:clean
```

## Criar de novo

```powershell
.\scripts\create-phase-backup.ps1 -PhaseId Backupv1.4
```

## Âmbito

Igual ao **Backupv1.3**: admin reorganizado, Library bar, fila 00019, Fish/visor, §28–§29. Ver `docs/BACKUP-Backupv1.3.md` para detalhe.

## Backup anterior

`Backupv1.3` — `C:\Users\55479\Desktop\EchonX-backups\Backupv1.3\`
