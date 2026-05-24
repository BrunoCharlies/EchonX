import Link from "next/link";
import { EXPLAINER_PAGES, EXPLAINER_STATUS_LABEL } from "@/lib/docs/explainer-pages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Temporary insights hub — not part of production product navigation.
 * URL: /docs/html/readme
 */
export default function DocsHtmlReadmePage() {
  return (
    <div className="mx-auto min-h-[calc(100dvh-96px)] max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="mb-8 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100/90">
        <strong className="font-medium text-amber-50">Página temporária.</strong> Só para entender ideias e
        decisões em desenvolvimento. Não aparece no menu do produto; pode ser removida quando o time não precisar
        mais.
      </div>

      <header className="mb-10 space-y-3">
        <p className="text-sm font-medium text-primary">EchonX · Insights (dev)</p>
        <h1 className="text-3xl font-semibold tracking-tight">README — explicações</h1>
        <p className="max-w-2xl text-muted-foreground leading-relaxed">
          Visão rápida dos temas discutidos com o assistente. Cada card resume o insight; o link{" "}
          <span className="text-foreground">Ler documento completo</span> abre a página HTML detalhada.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" size="sm" asChild>
            <Link href="/docs/html/echonx-explicacoes-index.html">Índice HTML (lista simples)</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/explore">Voltar ao app</Link>
          </Button>
        </div>
      </header>

      <div className="space-y-4">
        {EXPLAINER_PAGES.map((page) => (
          <Card key={page.slug} className="border-border/80 bg-card/70">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <CardTitle className="text-lg">{page.title}</CardTitle>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                  {EXPLAINER_STATUS_LABEL[page.status]}
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground">{page.updated}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-foreground/90">{page.summary}</p>
              <div className="flex flex-wrap gap-1.5">
                {page.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border/70 bg-background/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Button asChild size="sm" className="gap-2">
                <Link href={page.htmlHref}>Ler documento completo →</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-10 rounded-2xl border border-dashed border-border/70 bg-card/40 p-5 text-sm text-muted-foreground">
        <h2 className="mb-2 text-base font-medium text-foreground">Como adicionar uma nova explicação</h2>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            Criar <code className="rounded bg-muted px-1">public/docs/html/AAAA-MM-tema.html</code> (e cópia em{" "}
            <code className="rounded bg-muted px-1">docs/html/</code> se quiser).
          </li>
          <li>
            Registrar em <code className="rounded bg-muted px-1">src/lib/docs/explainer-pages.ts</code> e no índice{" "}
            <code className="rounded bg-muted px-1">echonx-explicacoes-index.html</code>.
          </li>
          <li>Abrir esta página: <code className="rounded bg-muted px-1">/docs/html/readme</code></li>
        </ol>
      </section>

      <footer className="mt-8 text-xs text-muted-foreground">
        URL canônica deste hub: <code className="rounded bg-muted px-1">/docs/html/readme</code>
      </footer>
    </div>
  );
}
