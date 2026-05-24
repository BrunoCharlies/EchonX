# Stripe — ativar pagamentos e planos (EchonX)

Este guia liga a conta Stripe ao EchonX para que, após pagamento confirmado, o webhook atualize subscrições e quotas.

**Documentação HTML completa (regras Library, upgrade A, downgrade imediato, bloqueio):**  
`/docs/html/2026-05-qubic-echonx-moeda-assinatura.html#stripe-library-billing-maio-2026` (§30)

**Alternar live/test sem editar `.env.local` à mão:** [STRIPE-ENV-SWITCH.md](./STRIPE-ENV-SWITCH.md)

## 1. Conta e produtos no Stripe Dashboard

1. Crie ou abra a conta em [https://dashboard.stripe.com](https://dashboard.stripe.com).
2. **Modo teste** primeiro (toggle *Test mode*).
3. **Products** → crie três produtos recorrentes mensais (nomes alinhados ao app):
   - Starter — US$ 9/mês
   - Popular — US$ 19/mês
   - Pro — US$ 39/mês
4. Em cada produto, copie o **Price ID** (`price_...`) — não o Product ID.

## 2. Variáveis de ambiente (`.env.local` e Vercel)

```env
NEXT_PUBLIC_APP_URL=http://localhost:3002

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_POPULAR=price_...
STRIPE_PRICE_PRO=price_...
```

Também precisa de Supabase (`SUPABASE_SERVICE_ROLE_KEY`) para o webhook gravar subscrições.

Aplique a migração `00020_stripe_subscription_id.sql` no Supabase se ainda não correu.

## 3. Webhook (local com Stripe CLI)

Instale a [Stripe CLI](https://stripe.com/docs/stripe-cli) e autentique:

```bash
stripe login
stripe listen --forward-to localhost:3002/api/webhooks/stripe
```

A CLI imprime `whsec_...` — use esse valor em `STRIPE_WEBHOOK_SECRET` enquanto desenvolve localmente.

Eventos tratados pela app:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## 4. Webhook em produção (Vercel)

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://echonx.app/api/webhooks/stripe` (ou o seu domínio)
3. Selecione os eventos acima
4. Copie o **Signing secret** para `STRIPE_WEBHOOK_SECRET` em Production na Vercel

## 5. Customer Portal (opcional mas recomendado)

Stripe Dashboard → **Settings → Billing → Customer portal** — ative cancelamento e atualização de método de pagamento.

A app expõe **Manage subscription** em `/app/settings/billing` (`POST /api/billing/portal`).

## 6. Fluxo na app

| Passo | O que acontece |
|-------|----------------|
| Utilizador clica num plano | `POST /api/billing/checkout` → redirect Stripe Checkout |
| Pagamento OK | Redirect `?checkout=success` |
| Stripe envia webhook | Upsert em `subscriptions` (`plan`, `current_period_end`, `stripe_customer_id`) |
| App | `loadUserEntitlement` → limites de X + Fish em `/api/listening/tts` |

**Library Premium** usa checkout próprio (`STRIPE_PRICE_LIBRARY_*`). Ver [LIBRARY-BILLING.md](./LIBRARY-BILLING.md).

## 7. Testar

1. `npm run dev` (porta 3002)
2. `stripe listen --forward-to localhost:3002/api/webhooks/stripe`
3. Login → **Settings → Billing** → escolher Starter
4. Cartão de teste: `4242 4242 4242 4242`
5. Confirmar em Supabase: `subscriptions.plan` = `starter` e `current_period_end` no futuro

## 8. Produção

- Troque chaves `pk_live_` / `sk_live_` e Price IDs de produção
- Webhook de produção com URL HTTPS
- `NEXT_PUBLIC_APP_URL` = domínio real (URLs de success/cancel do Checkout)
