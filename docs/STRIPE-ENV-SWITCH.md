# Alternar Stripe Live ↔ Test (sem editar `.env.local` à mão)

Ficheiros separados (gitignored):

| Ficheiro | Uso |
|----------|-----|
| `env/stripe.live.env` | Chaves e preços **live** (produção) |
| `env/stripe.test.env` | Chaves e preços **test** (cartão `4242…`) |
| `env/.stripe-mode` | Indica o último modo aplicado (`live` ou `test`) |

O resto do `.env.local` (Supabase, Fish, X, etc.) **não muda**.

## Configuração inicial (uma vez)

```powershell
npm run stripe:init
```

- Cria `env/stripe.live.env` a partir do teu `.env.local` atual.
- Cria `env/stripe.test.env` a partir do exemplo — **preenche** com Dashboard em **Test mode**.

## Alternar

```powershell
# Teste (4242 4242 4242 4242)
npm run stripe:use-test

# Produção (cobrança real)
npm run stripe:use-live
```

Depois **reinicia** `npm run dev`.

Atalhos:

```powershell
npm run dev:stripe-test
npm run dev:stripe-live
```

## Webhook local

Cada modo tem o seu `whsec_`:

1. `stripe listen --forward-to localhost:3002/api/webhooks/stripe`
2. Copia o `whsec_...` para `env/stripe.test.env` **ou** `env/stripe.live.env`
3. `npm run stripe:use-test` (ou `use-live`) de novo

## Ver modo ativo

```powershell
type env\.stripe-mode
```

## Produção (echonx.app / Vercel)

O site em produção **não** lê `env/stripe.live.env` — usa variáveis no **Vercel → Project → Settings → Environment Variables** (Production).

### 1. Stripe Dashboard — modo Live

1. Desliga **Test mode** (interruptor no canto superior do Dashboard).
2. Confirma que existem **Products / Prices** em Live para:
   - Audiopost: Starter, Popular, Pro
   - Library: Starter, Popular, Pro
   - (opcional) AI Analysis — se ainda não existir, cria o produto e copia o `price_...` live
3. Copia as chaves **live**:
   - `pk_live_...` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `sk_live_...` → `STRIPE_SECRET_KEY` (só servidor; nunca no cliente)

### 2. Webhook em Live (obrigatório)

O `whsec_` do `stripe listen` **só serve em local**. Em produção:

1. Stripe → **Developers → Webhooks → Add endpoint**
2. URL: `https://echonx.app/api/webhooks/stripe`
3. Eventos (mínimo):
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copia o **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET` na Vercel

### 3. Variáveis na Vercel (Production)

Cola os valores de `env/stripe.live.env` (ou corre `npm run stripe:use-live` e copia do `.env.local`):

| Variável | Notas |
|----------|--------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_` do endpoint **live** em echonx.app |
| `STRIPE_PRICE_STARTER` / `POPULAR` / `PRO` | IDs `price_...` **live** |
| `STRIPE_PRICE_LIBRARY_*` | IDs live da Library |
| `STRIPE_PRICE_AI_ANALYSIS` | Preencher se AI checkout estiver ativo |
| `NEXT_PUBLIC_APP_URL` | `https://echonx.app` (redirects do Checkout) |

Depois: **Redeploy** do projeto (env só aplica em novo deploy).

### 4. Local com live (opcional)

```powershell
# Preenche env/stripe.live.env (inclui whsec live se testares webhook local com --live)
npm run stripe:use-live
npm run dev
```

### 5. Verificação pós-deploy

1. `/app/settings/billing` — botões de checkout devem aparecer (não “Coming soon”).
2. Checkout de teste com valor mínimo ou cupom — confirma redirect `?checkout=success`.
3. Stripe → Webhooks → endpoint echonx.app — eventos com resposta **200**.
4. Supabase — tabelas `subscriptions` / `library_subscriptions` / `ai_subscriptions` atualizadas após pagamento.

### Atenção

- **Nunca** uses `pk_test_` / `sk_test_` / preços `price_` de test na Vercel Production.
- Subscrições criadas em test **não** migram para live — clientes precisam subscrever de novo em live.
- Em `env/stripe.live.env`, `STRIPE_PRICE_AI_ANALYSIS` deve estar preenchido antes de ativar AI em produção.
