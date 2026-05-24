# Backupv1.0 — ponto de restauração oficial

Sistema **funcional** tal como validado pelo utilizador (Maio 2026). Use este nome em conversas: *“restaurar Backupv1.0”*.

## Identificação

| Campo | Valor |
|--------|--------|
| **ID** | `Backupv1.0` |
| **Versão** | `0.1.0` (`package.json`) |
| **Data** | 2026-05-21 |
| **Servidor local** | http://localhost:3002 |

## Endereços do backup (Windows)

```
C:\Users\55479\Desktop\EchonX-backups\Backupv1.0\
├── EchonX-full-source.zip    (~351 ficheiros, código completo)
├── EchonX-mirror\            (cópia espelho — restore rápido)
├── MANIFEST.json
└── RESTORE.md
```

**Não apague** a pasta `EchonX-backups` no Desktop.

## O que este backup inclui

- Rotas: `(audiopost)/` → `/app`; `(standard)/` → explore, settings, discover, onboarding
- §23 About + header/footer marketing
- §24 Audiopost dashboard (sidebar, Now Playing, Library, PDF, barra inferior)
- PDF worker em `public/pdf.worker.min.mjs` + `scripts/copy-pdf-worker.js`
- Login otimizado (`revalidateAfterAuth`, `ListenQueue` só em `/app` e `/profile`)
- `scripts/ensure-app-routes.js`, `kill-port.js`, `dev:clean`

## O que não inclui

- `node_modules`, `.next`, `.next-dev`
- `.env.local` — **copie manualmente** antes de restaurar noutra máquina

## Restaurar

```powershell
cd C:\Users\55479\Desktop\EchonX
.\scripts\restore-phase-backup.ps1 -Phase Backupv1.0
npm install
npm run dev:clean
```

## HTML

Secção **§25** em `docs/html/2026-05-qubic-echonx-moeda-assinatura.html` (âncora `#backup-v1`).
