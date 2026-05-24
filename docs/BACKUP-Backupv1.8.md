# Backupv1.8 — cópia de segurança (Maio 2026)

Ponto de restauração após **redesign da aba Explore** (layout 4 colunas, feed com largura limitada, sidebars enriquecidas). Inclui tudo do **Backupv1.7**.

## Identificação

| Campo | Valor |
|--------|--------|
| **ID** | `Backupv1.8` |
| **Versão** | `0.1.0` (`package.json`) |
| **Data** | 2026-05-23 |
| **Ficheiros no ZIP** | 460 |
| **Servidor local** | http://localhost:3002 |

## Endereços do backup (Windows)

```
C:\Users\55479\Desktop\EchonX-backups\Backupv1.8\
├── EchonX-full-source.zip
├── EchonX-mirror\
├── MANIFEST.json
└── RESTORE.md
```

## Criar de novo

```powershell
.\scripts\create-phase-backup.ps1 -PhaseId Backupv1.8
```

## O que este backup inclui (vs Backupv1.7)

- **Explore — 4 colunas (desktop):** esquerda (perfil + stats + perfis ativos) · feed (~500px) · Feed Signals + atividade (coluna estreita) · Now Listening / Trending / recomendações (coluna direita).
- **Feed:** filtros, ordenação, busca, banner de novos posts, cards com waveform animado ao play.
- **Dados laterais:** `load-explore-extras.ts` (trending, recomendações, atividade, métricas 24h).
- **UI:** `explore-page-shell.tsx`, `explore-left-sidebar.tsx`, `explore-right-inner-column.tsx`, `explore-right-outer-column.tsx`, `explore-feed-toolbar.tsx` (Sort by alinhado).
- **Layout:** `app/(standard)/explore/layout.tsx` — largura total até ~1560px.
- **Heranço v1.7:** hidratação Listening map, volume Library, a11y busca, v1.6/v1.5.

## Doc HTML

- §36 — `#explore-feed-4colunas-maio-2026`
- §37 — `#backup-v1-8`

## Backup anterior

`Backupv1.7` — `C:\Users\55479\Desktop\EchonX-backups\Backupv1.7\`
