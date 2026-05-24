# Backupv1.9 — cópia de segurança (Maio 2026)

Ponto de restauração **antes de novas alterações** após o pacote Explore (refresh do feed, proporção de imagens importadas do X, tema Lumos). Inclui tudo do **Backupv1.8**.

## Identificação

| Campo | Valor |
|--------|--------|
| **ID** | `Backupv1.9` |
| **Versão** | `0.1.0` (`package.json`) |
| **Data** | 2026-05-18 |
| **Ficheiros no ZIP** | 465 |
| **Servidor local** | http://localhost:3002 |

## Endereços do backup (Windows)

```
C:\Users\55479\Desktop\EchonX-backups\Backupv1.9\
├── EchonX-full-source.zip
├── EchonX-mirror\
├── MANIFEST.json
└── RESTORE.md
```

## Criar de novo

```powershell
.\scripts\create-phase-backup.ps1 -PhaseId Backupv1.9
```

## O que este backup inclui (vs Backupv1.8)

- **Refresh feed:** `refreshExploreFeed()` + `revalidatePath`, contagem de posts não vistos, realtime sem auto-refresh silencioso (`explore-page-shell.tsx`, `explore-feed-live.tsx`, `server/actions/explore-feed.ts`).
- **Imagens X:** `PostFeedImage` — proporção nativa para `qubic_x` / `x` / `external_x`; 16:9 mantido em posts nativos; `xImageDimensions` na importação Qubic (`lib/x/client.ts`, `lib/posts/post-image-display.ts`).
- **Tema Lumos:** `isAudiopostPath` limitado ao dashboard `/app` (Explore/Settings recebem tema do perfil).
- **Explore UX:** busca discreta no feed, contador de caracteres no composer (450+), filtros na mesma linha, card de perfil fixo na coluna esquerda.
- **Heranço v1.8:** layout 4 colunas, sidebars, hidratação v1.7, Library/Stripe anteriores.

## Doc HTML

- §38 — `#explore-feed-refresh-imagens-x-maio-2026`
- §39 — `#backup-v1-9`

## Backup anterior

`Backupv1.8` — `C:\Users\55479\Desktop\EchonX-backups\Backupv1.8\` (estado **sem** refresh feed / imagens X naturais)
