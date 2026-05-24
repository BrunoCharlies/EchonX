# Backupv1.13 — cópia de segurança (Maio 2026)

Ponto de restauração após **layout responsivo mobile/tablet** (shell drawer, Audiopost stack &lt; 1024 px), **correções de duplicação/scroll** (Library, Now Playing, Upload PDF, barra de voz compacta) e documentação HTML **§44.4–§44.6**. Inclui tudo do **Backupv1.12**.

## Identificação

| Campo | Valor |
|--------|--------|
| **ID** | `Backupv1.13` |
| **Versão** | `0.1.0` (`package.json`) |
| **Data** | 2026-05-24 |
| **Commits de referência** | `8d59131` (responsive Audiopost mobile) |
| **Ficheiros no ZIP** | 567 |
| **Servidor local** | http://localhost:3002 |

## Endereços do backup (Windows)

```
C:\Users\55479\Desktop\EchonX-backups\Backupv1.13\
├── EchonX-full-source.zip
├── EchonX-mirror\
```

## Criar de novo

```powershell
.\scripts\create-phase-backup.ps1 -PhaseId Backupv1.13
```

## O que este backup inclui (vs Backupv1.12)

- **Breakpoints:** `src/lib/layout/breakpoints.ts`, `src/hooks/use-layout-breakpoint.ts` (`lg` = 1024 px).
- **App shell:** sidebar só em `lg+`; menu ☰ + `app-mobile-nav-drawer.tsx`; `app-sidebar-nav.tsx`.
- **Audiopost mobile:** `audiopost-dashboard-mobile.tsx` — stack Now playing → X → Library → PDF; desktop grid `hidden lg:flex`.
- **Correções mobile (§44.6):** sem dashboard duplicado; `LibraryBottomBar` compacta; PDF `layout="stack"` com scroll e padding inferior.
- **Herança v1.12:** perfil JPEG/PNG, favicon, copy Desktop, fix Vercel `.next-dev`.

## Doc HTML

- §44 — `#layout-responsivo-breakpoints-maio-2026`
- §44.6 — `#audiopost-mobile-correcoes-maio-2026`
- §47 — `#backup-v1-13`

## Backup anterior

`Backupv1.12` — `C:\Users\55479\Desktop\EchonX-backups\Backupv1.12\`
