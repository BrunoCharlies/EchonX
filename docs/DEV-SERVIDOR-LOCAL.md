# Dev local — erros comuns

## 1. Internal Server Error (500) em todas as páginas

### Sintoma

- `http://localhost:3002/` mostra só **Internal Server Error**
- DevTools: `routes-manifest.json` em falta ou `_document.js` not found

### Causa

Servidor `next dev` **antigo** ainda a correr enquanto o cache `.next-dev` foi apagado ou ficou corrompido (muito comum após mudanças de rotas ou restore de backup).

### Correção

```powershell
cd C:\Users\55479\Desktop\EchonX
npm run dev:clean
```

Isto: liberta a porta 3002, remove rotas flat duplicadas, apaga `.next-dev` e `.next`, e sobe o dev de novo.

Espere **1–2 minutos** na primeira compilação. Depois **Ctrl+Shift+R** no browser.

---

## 2. ChunkLoadError / botões sem ação

### Sintoma

- `ChunkLoadError: Loading chunk ... failed`
- Página em branco, botões não respondem

### Causa

Cache do browser ou `.next-dev` com chunks de rotas **duplicadas** (flat + `(audiopost)`/`(standard)` ao mesmo tempo).

### Correção

1. `npm run dev:clean` (como acima)
2. Chrome: **Ctrl+Shift+R**
3. Se persistir: DevTools → **Application** → **Service Workers** → *Unregister*

`npm run predev` corre automaticamente antes de `npm run dev` para evitar duplicados.

---

## URL

Tudo em `http://localhost:3002` — `/`, `/about`, `/app` (Audiopost + sidebar), `/app/explore` (nav no topo).

## Layout (Maio 2026)

- **`/app`:** sidebar + dashboard Audiopost (§24 HTML)
- **`/app/explore`, settings, …:** `AppShellHeader` clássico
- **Marketing:** `/`, `/about`, `/pricing`
