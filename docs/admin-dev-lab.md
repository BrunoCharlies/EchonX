# Admin Development Lab

Ambiente de testes **admin-only** (`/admin/lab/*`) para experimentar funcionalidades sem alterar o produto em `/app`.

## Princípio

| Camada | Onde testar | Onde está em produção |
|--------|-------------|------------------------|
| Voice / queue player (Fish test) | `/admin/lab/voice` | `/app` (Now Playing + `FloatingListenPlayer`) |
| Biblioteca / PDF | (planeado — Fish Premium separado) | `/app` dashboard |
| Futuras features | Novo slug em `dev-lab-registry.ts` | Após merge manual |

**Não há deploy automático** do lab para produção. Testes OK → copiar diff para os ficheiros principais → rever em PR.

## Rotas

- `/admin/lab` — índice de labs
- `/admin/lab/voice` — reprodutor de fila (cópia embutida)

Acesso: `role = admin` (middleware em `/admin/*`).

## Adicionar um lab

1. Criar página em `src/app/admin/lab/<slug>/page.tsx`
2. Componente em `src/components/admin/lab/<name>-lab.tsx`
3. Registar em `src/lib/admin/dev-lab-registry.ts`

## Fish Audio (Maio 2026)

1. Criar conta em [fish.audio](https://fish.audio) e copiar API key para `.env.local`:

   `FISH_AUDIO_API_KEY=...`

2. Reiniciar `npm run dev`.

3. Abrir `/admin/lab/voice` → card **Fish Audio (lab)** deve mostrar *API ready*.

4. Proxy: `GET/POST /api/admin/lab/tts` (admin-only). O browser **nunca** vê a chave.

5. Vozes opcionais: `FISH_AUDIO_REFERENCE_ID_EN`, `FISH_AUDIO_REFERENCE_ID_PT_BR`, etc.

Precificação (Audiopost vs Biblioteca): `docs/html/...#precificacao-voz-2026` · código: `src/lib/billing/voice-products.ts`.

## Isolação

- Lab usa `getLabVoiceEngine()` (Fish ou fallback Web Speech) — **não** `getSharedVoiceEngine()`.
- UI prefs do player ainda partilham `localStorage` com `/app` — prefixo `echonx:lab:*` é evolução futura.

## Reversão

Apagar `src/app/admin/lab/`, `src/components/admin/lab/`, e o card no admin dashboard — `/app` não é afetado.
