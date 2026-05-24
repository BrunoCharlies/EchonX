# Backupv1.12 — cópia de segurança (Maio 2026)

Ponto de restauração após **perfil (JPEG/PNG, username, erros amigáveis)**, **favicon X**, **copy Desktop na homepage/app**, **logomarca oficial** e **fix deploy Vercel** (`.next-dev` fora do Git). Inclui tudo do **Backupv1.11**.

## Identificação

| Campo | Valor |
|--------|--------|
| **ID** | `Backupv1.12` |
| **Versão** | `0.1.0` (`package.json`) |
| **Data** | 2026-05-24 |
| **Commits de referência** | `86eb1e8` (perfil), `6a79051` (favicon/copy), `45ead70` (Vercel) |
| **Ficheiros no ZIP** | 559 |
| **Servidor local** | http://localhost:3002 |

## Endereços do backup (Windows)

```
C:\Users\55479\Desktop\EchonX-backups\Backupv1.12\
├── EchonX-full-source.zip
├── EchonX-mirror\
```

## Criar de novo

```powershell
.\scripts\create-phase-backup.ps1 -PhaseId Backupv1.12
```

## O que este backup inclui (vs Backupv1.11)

- **Perfil:** apenas JPEG/PNG; mensagens sem nomes de fornecedor; `@` opcional no username; validação letras + números (`lib/profiles/username.ts`, `lib/uploads/profile-images.ts`).
- **Favicon / PWA:** `public/brand/echonx-favicon.png`, `src/app/icon.png`, `apple-icon.png`, ícones estáticos (removidos `icon.tsx` gerados).
- **Marketing / app:** hero *Hear Only What Matters On Your Desktop.*; badge Desktop na sidebar; i18n PT/EN/ES/FR.
- **Logomarca:** header `echonx-logo.png`, footer `echonx-logo-footer.png`.
- **Build produção:** `.next-dev/` no `.gitignore`; `eslint.ignoreDuringBuilds` em `next.config.ts`.
- **Herança v1.11:** perfil Intelligence UI, Lumos, AI Context, Stripe, Explore.

## Doc HTML

- §44 — `#layout-responsivo-breakpoints-maio-2026`
- §45 — `#producao-perfil-favicon-desktop-maio-2026`
- §46 — `#backup-v1-12`

## Backup anterior

`Backupv1.11` — `C:\Users\55479\Desktop\EchonX-backups\Backupv1.11\`
