# Backupv1.14 — cópia de segurança (Maio 2026)

Ponto de restauração após **fase 2 responsiva** (marketing, auth, `/profile`, `AppShellHeader` mobile), **Library Premium em `/pricing`**, e documentação HTML §44.7. Inclui tudo do **Backupv1.13** (Audiopost mobile v2) e alterações locais ainda não commitadas no Git remoto.

## Identificação

| Campo | Valor |
|--------|--------|
| **ID** | `Backupv1.14` |
| **Versão** | `0.1.0` (`package.json`) |
| **Data** | 2026-05-24 |
| **Commits Git (remoto)** | `8d59131` (último push: Audiopost mobile) |
| **Ficheiros no ZIP** | 570 |
| **Servidor local** | http://localhost:3002 |

## Endereços do backup (Windows)

```
C:\Users\55479\Desktop\EchonX-backups\Backupv1.14\
├── EchonX-full-source.zip
├── EchonX-mirror\
```

## Criar de novo

```powershell
.\scripts\create-phase-backup.ps1 -PhaseId Backupv1.14
```

## O que este backup inclui (vs Backupv1.13)

- **Fase 2 responsiva (§44.7):** `AppShellHeaderClient`, drawer guest/app; `SiteHeader` em `lg:`; homepage/pricing/explore marketing; auth layout; `/profile` + onboarding padding.
- **Pricing:** secção `#library-premium` com `LIBRARY_PLANS` (Starter / Popular / Pro); `libraryPlanBillingCallbackUrl`, `PricingSignInCta` com callback para billing.
- **Herança v1.13:** Audiopost stack mobile, correções scroll/PDF, barra compacta, `hidden lg:flex` no dashboard desktop.

## Doc HTML

- §44.7 — `#layout-responsivo-fase-2-maio-2026`
- §48 — `#backup-v1-14`

## Backup anterior

`Backupv1.13` — `C:\Users\55479\Desktop\EchonX-backups\Backupv1.13\`
