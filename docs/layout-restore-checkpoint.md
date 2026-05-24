# Checkpoint — layout Audiopost (Maio 2026)

Use este ficheiro para **reverter** o redesign do shell lateral + dashboard `/app` se algo falhar em produção.

> **Maio 2026 — Audiopost ativo só em `/app`:** route groups `(audiopost)` + `(standard)`; `ensure-app-routes.js` remove rotas **flat** duplicadas. Explore/Settings mantêm `AppShellHeader`. **Não usar** `app-layout-switcher` (causava 500). Após mudanças de rotas: `npm run dev:clean`.

## Antes da alteração

| Área | Comportamento |
|------|----------------|
| Nav principal | `AppNav` horizontal no `AppShellHeader` (Explore, Settings, etc.) |
| Layout `/app/explore`, settings… | `max-w-6xl` centrado, header sticky |
| Layout `/app` | Painel leitura empilhado (sem sidebar) |
| `/app` | Cards onboarding + `AudiopostReadingPanel` (library, PDF, X form empilhados) |
| Player fila | `FloatingListenPlayer` portal + FAB "Initiate Audiopost" em todo `/app/*` e `/profile/*` |

## Depois da alteração

| Área | Comportamento |
|------|----------------|
| Nav em `/app` only | `AppSidebar` lateral |
| Top bar em `/app` only | Pesquisa + utilizador |
| `/app/explore`, etc. | `AppShellHeader` + `AppNav` como antes |
| `/app` | `AudiopostDashboard` em grelha (Now Playing fixo, …) |
| Player fila em `/app` | `FloatingListenPlayer` `variant="embedded"` — sem FAB/portal |
| Outras rotas `/app/*`, `/profile/*` | Player flutuante **inalterado** (FAB + portal) |
| Barra inferior | Só em `/app` — reproduz livro/PDF da biblioteca |

## Ficheiros novos

- `src/components/app/app-shell.tsx`
- `src/components/app/app-sidebar.tsx`
- `src/components/app/app-top-bar.tsx`
- `src/components/app/audiopost-dashboard.tsx`
- `src/components/app/audiopost-now-playing-shell.tsx`
- `src/components/app/audiopost-listening-map-card.tsx`
- `src/components/app/audiopost-library-section.tsx`
- `src/components/app/audiopost-x-profiles-panel.tsx`
- `src/components/app/audiopost-pdf-upload-panel.tsx`
- `src/components/app/library-bottom-bar.tsx`
- `src/contexts/audiopost-library-context.tsx`

## Ficheiros alterados

- `src/app/app/(audiopost)/layout.tsx`
- `src/app/app/(audiopost)/page.tsx`
- `src/app/app/(standard)/layout.tsx`
- `src/app/app/layout.tsx` (passthrough)
- `src/app/app/page.tsx`
- `src/components/app/app-shell-header.tsx` (simplificado ou removido do layout app)
- `src/components/listen/listen-queue-provider.tsx`
- `src/components/listen/floating-listen-player.tsx` (`variant` embedded)
- `src/components/app/pdf-reading-player.tsx` (`compact` / controles externos)
- `docs/html/2026-05-qubic-echonx-moeda-assinatura.html` (§24, §26)

## Reversão rápida

1. Restaurar `src/app/app/layout.tsx` e `page.tsx` da versão anterior (git).
2. Remover imports de `AppShell` e voltar a `AppShellHeader` + `max-w-6xl`.
3. Em `listen-queue-provider.tsx`, remover `isAudiopostHome` e voltar portal/FAB para `pathname === "/app"`.
4. Apagar componentes novos listados acima se não forem usados.

## Fix “1 Issue” (dev overlay)

- `src/contexts/audiopost-library-context.tsx` — `setPlayback` estável (`useCallback` + shallow compare)
- `src/components/app/pdf-reading-player.tsx` — `onPlaybackUpdateRef` evita loop no `useEffect`

## Segurança (não alterado)

- APIs `/api/listening/queue`, actions `listen`, `x-listening`, `listening-queue`
- Entitlements / billing / cron sync
- `claimVoicePlayback` owners (`queue-player`, `pdf-reader`, `post-listen`)

---

## Checkpoint — barra inferior Audiopost (Maio 2026, lift 8px)

**Motivo:** botão Play encostava à margem inferior / barra de tarefas do SO.

### Alteração

| Ficheiro | O quê |
|----------|--------|
| `src/components/app/audiopost-bottom-bar-layout.ts` | **Novo** — constantes `AUDIOPOST_BOTTOM_BAR_LIFT_PX = 8`, altura `72` |
| `src/components/app/library-bottom-bar.tsx` | `bottom: 8px` (em vez de `0`), `pb-1` no contentor, Play com `-translate-y-0.5` |
| `src/components/app/audiopost-dashboard.tsx` | `DASHBOARD_HEIGHT` subtrai `80px` (72+8), não sobrepõe os cards |

### Reverter (só este lift)

1. Em `audiopost-bottom-bar-layout.ts`, definir `AUDIOPOST_BOTTOM_BAR_LIFT_PX = 0`.
2. Em `library-bottom-bar.tsx`, opcional: remover `pb-1`, `-translate-y-0.5` no Play.
3. Guardar — `audiopost-dashboard.tsx` lê as constantes automaticamente.

Ou git restore dos 3 ficheiros acima para o commit anterior a este checkpoint.

---

## Checkpoint — sidebar nav refinada (Maio 2026)

**Motivo:** menu lateral com tipografia demasiado pesada; coluna ligeiramente larga.

### Alteração

| Ficheiro | O quê |
|----------|--------|
| `src/components/app/app-sidebar-layout.ts` | Larguras `232px` / `68px` (antes `260` / `72`) |
| `src/components/app/app-sidebar.tsx` | `text-[13px] font-normal`, ícones `16px`, highlight mais suave |
| `src/components/app/app-shell.tsx` | CSS var alinhada às constantes |

### Reverter

Em `app-sidebar-layout.ts`: `APP_SIDEBAR_WIDTH_EXPANDED_PX = 260`, `COLLAPSED = 72`. Restaurar classes antigas em `app-sidebar.tsx` (`text-sm font-medium`, `w-[260px]`, etc.) se necessário.

**Alinhamento grid (Maio 2026):** logo row `h-16` + `border-border/60` = `AppTopBar`; slot inferior da sidebar com `border-t border-white/[0.06]` + `marginBottom`/`height` iguais ao `LibraryBottomBar`.
