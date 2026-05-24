# Backupv1.2 — cópia de segurança (Maio 2026)

Ponto de restauração após **barra Library (volume + equalizer)**, **logo → Explore**, **planos Library Premium (UI)** e ajustes de UX no Audiopost.

## Identificação

| Campo | Valor |
|--------|--------|
| **ID** | `Backupv1.2` |
| **Versão** | `0.1.0` (`package.json`) |
| **Data** | 2026-05-22 |
| **Ficheiros no ZIP** | 402 |
| **Servidor local** | http://localhost:3002 |

## Endereços do backup (Windows)

```
C:\Users\55479\Desktop\EchonX-backups\Backupv1.2\
├── EchonX-full-source.zip
├── EchonX-mirror\            (cópia espelho — restore rápido)
├── MANIFEST.json
└── RESTORE.md
```

**Não apague** a pasta `EchonX-backups` no Desktop.

## O que este backup inclui (vs Backupv1.1)

- **§29 HTML** + `public/docs/html/` sincronizado — barra Library, volume, equalizer
- `src/components/app/library-bottom-bar.tsx` — volume, painel Reading settings (velocidade + idioma), sem Shuffle/Repeat
- `src/lib/voice/library-playback-settings.ts` — persistência local de velocidade/idioma
- `src/contexts/audiopost-library-context.tsx` — `libraryBarVolume`, `libraryBarRate`, `libraryBarLanguage`
- `src/components/app/pdf-reading-player.tsx` — `volume` + `rate` + idioma na leitura da Library
- `src/lib/voice/voice-engine.ts` — opção `volume` no Web Speech
- Logo sidebar → `/app/explore` (`app-sidebar.tsx`)
- `next.config.ts` — `devIndicators: false`
- `src/lib/billing/library-plans.ts` + cartões Premium na billing page
- Player Audiopost: `audiopost-now-playing-shell.tsx`, Fish em `/api/listening/tts` (Starter+)
- Tudo do **Backupv1.1** (§28, fila 00019, Fish lab, pt-BR, admin X, etc.)

## O que não inclui

- `node_modules`, `.next`, `.next-dev`
- `.env.local` — **guarde cópia à parte** antes de restaurar

## Criar de novo este backup

```powershell
cd C:\Users\55479\Desktop\EchonX
.\scripts\create-phase-backup.ps1 -PhaseId Backupv1.2
```

## Restaurar

Ver `C:\Users\55479\Desktop\EchonX-backups\Backupv1.2\RESTORE.md` ou:

```powershell
.\scripts\restore-phase-backup.ps1 -Phase Backupv1.2
npm install
npx supabase db push
npm run dev:clean
```

## Backup anterior

`Backupv1.1` — `docs/BACKUP-Backupv1.1.md` · HTML §28 `#audiopost-voz-fila-maio-2026`
