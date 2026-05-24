# Backupv1.11 — cópia de segurança (Maio 2026)

Ponto de restauração após **perfil nativo Intelligence UI**, **Lumos no profile**, **reparação de `kind` native/external** e **contraste Cognitive tags**. Inclui tudo do **Backupv1.10**.

## Identificação

| Campo | Valor |
|--------|--------|
| **ID** | `Backupv1.11` |
| **Versão** | `0.1.0` (`package.json`) |
| **Data** | 2026-05-24 |
| **Ficheiros no ZIP** | 498 |
| **Servidor local** | http://localhost:3002 |

## Endereços do backup (Windows)

```
C:\Users\55479\Desktop\EchonX-backups\Backupv1.11\
├── EchonX-full-source.zip
├── EchonX-mirror\
```

## Criar de novo

```powershell
.\scripts\create-phase-backup.ps1 -PhaseId Backupv1.11
```

## O que este backup inclui (vs Backupv1.10)

- **Perfil nativo next-gen:** `NativeProfileExperience` — hero, métricas, AI summary, reputação, transmissions, network, timeline.
- **Layout legado:** `LegacyPublicProfileLayout` para `external_x` e `curator`.
- **Lumos no profile:** `src/styles/native-profile-lumos.css` + classes `np-hero-*`, `np-cognitive-tag`.
- **Profile kind:** `repair-profile-kind.ts`, `profile-kind.ts`; fix em `x-listening` e `profile.ts`.
- **Herança v1.10:** AI Context Analysis, Stripe AI, migrações 00023/00024, Explore refresh, imagens X.

## Doc HTML

- §42 — `#native-profile-intelligence-maio-2026`
- §43 — `#backup-v1-11`

## Reverter só Lumos no perfil

Ver `src/styles/native-profile-lumos.REVERT.txt`.

## Backup anterior

`Backupv1.10` — `C:\Users\55479\Desktop\EchonX-backups\Backupv1.10\`
