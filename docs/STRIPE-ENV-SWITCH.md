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
