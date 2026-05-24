# Library Premium — regras e Stripe

Documento alinhado com as decisões de produto (maio 2026).

**Documentação HTML detalhada (produto + técnico):**  
[§30 no explainer](http://localhost:3002/docs/html/2026-05-qubic-echonx-moeda-assinatura.html#stripe-library-billing-maio-2026) · âncora `#stripe-library-billing-maio-2026`

## Free vs pago

| Modo | Voz | Limite |
|------|-----|--------|
| **Free** | Web Speech (navegador) | **Sem limite** de tempo de áudio |
| **Library Starter / Popular / Pro** | Fish S2 Pro | Cota mensal em bytes (UTF-8 narrado) |

Melhor qualidade = assinar um plano Library pago.

## Cota esgotada no meio do ciclo

1. **Regra A (upgrade):** só ganha mais bytes subindo de tier; o acréscimo é a **diferença** entre quotas mensais (ex.: Starter 300k → Popular +300k → total efetivo 600k no mesmo ciclo, mantendo o que já consumiu).
2. **Checkout:** cada plano tem o seu **Price ID** no Stripe; mudança de tier = **novo Checkout** (não proration na mesma sessão).
3. **Library Pro:** sem horas extra; aguarda o fim do ciclo e o **pagamento recorrente** confirmado no Stripe; o webhook repõe `bytes_consumed = 0` e a quota do tier.

## Downgrade

- **Corta na hora:** `period_byte_quota` passa ao teto do plano menor imediatamente.
- Se `bytes_consumed` > novo teto → Fish bloqueado até upgrade ou renovação.

## Renovação

- Evento Stripe (`customer.subscription.updated` com novo `current_period_end`, mesmo tier).
- `bytes_consumed = 0`, `period_byte_quota =` quota mensal do tier atual.

## Base de dados

Tabela `public.library_subscriptions` (migração `00021`):

- `plan`, `period_byte_quota`, `bytes_consumed`, `current_period_end`
- IDs Stripe separados dos planos Audiopost (`subscriptions`)

## Variáveis de ambiente

```env
STRIPE_PRICE_LIBRARY_STARTER=price_...
STRIPE_PRICE_LIBRARY_POPULAR=price_...
STRIPE_PRICE_LIBRARY_PRO=price_...
```

Metadata na subscrição Stripe: `billing_product=library`, `plan_tier=library-starter|…`.

## API

- `POST /api/billing/library/checkout` — body `{ "plan": "library-starter" }`
- Webhook: `src/app/api/webhooks/stripe/route.ts` → `library-stripe-sync.ts`

## Implementado (quota + bloqueio)

- `POST /api/library/tts` — valida cota, sintetiza Fish, debita UTF-8 bytes (`increment_library_bytes_consumed`)
- `GET /api/library/tts` — estado para o player (backend, bytes restantes, CTA upgrade)
- Player Library usa Fish só com quota; caso contrário Web Speech (ilimitado)
- Barra inferior: `LibraryQuotaStrip` (progresso, upgrade, renovação)

Migração: `00022_library_bytes_increment.sql`
