# Backupv1.7 — cópia de segurança (Maio 2026)

Ponto de restauração após **correção de hidratação (Listening map)**, **volume Library em tempo real** e **acessibilidade da busca**. Inclui tudo do **Backupv1.6**.

## Identificação

| Campo | Valor |
|--------|--------|
| **ID** | `Backupv1.7` |
| **Versão** | `0.1.0` (`package.json`) |
| **Data** | 2026-05-23 |
| **Ficheiros no ZIP** | 449 |
| **Servidor local** | http://localhost:3002 |

## Endereços do backup (Windows)

```
C:\Users\55479\Desktop\EchonX-backups\Backupv1.7\
├── EchonX-full-source.zip
├── EchonX-mirror\
├── MANIFEST.json
└── RESTORE.md
```

## Criar de novo

```powershell
.\scripts\create-phase-backup.ps1 -PhaseId Backupv1.7
```

## O que este backup inclui (vs Backupv1.6)

- **Listening map:** estado inicial vazio no SSR; `localStorage` só após mount — elimina erro de hidratação (`0m` vs `47m`) e badge **1 Issue** do Next.js Dev Tools.
- **Busca global:** `role="combobox"` + `listbox` — corrige aviso ESLint `aria-expanded` no header.
- **Library volume:** `VoiceEngine.setVolume()` + `useEffect` no player — slider da barra inferior ajusta áudio ao vivo.
- **Player sync:** deduplicação de patches de playback para o contexto da barra inferior.
- **Heranço v1.6:** troca de livro Library, remover perfis X, Stripe test (v1.5).

## Doc HTML

- §34 — `#atualizacoes-hydration-volume-maio-2026`
- §35 — `#backup-v1-7`

## Backup anterior

`Backupv1.6` — `C:\Users\55479\Desktop\EchonX-backups\Backupv1.6\`
