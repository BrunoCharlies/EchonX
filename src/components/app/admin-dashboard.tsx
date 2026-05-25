"use client";

import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  Activity,
  BookOpen,
  ExternalLink,
  FileText,
  FlaskConical,
  Pencil,
  RefreshCw,
  Sparkles,
  Upload,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { ADMIN_DOC_LINKS } from "@/lib/docs/explainer-pages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  saveEchonXReadingRecommendation,
  type RecommendedReadingItem,
} from "@/server/actions/recommended-reading";
import type { OfficialChannelState } from "@/lib/curator/ingest";
import { AdminMembersPanel } from "@/components/admin/admin-members-panel";
import { OfficialChannelAdmin } from "@/components/app/official-channel-admin";
import { QubicChannelAdmin } from "@/components/app/qubic-channel-admin";
import type { QubicChannelState } from "@/lib/curator/qubic-ingest";

type AdminView = "operations" | "members";

const X_SYNC_MANUAL_RESET_STORAGE_KEY = "echonx:x-sync-manual-reset-at";

type Metrics = {
  generatedAt: string;
  registeredUsers: number;
  activeUsers: number;
  onlineUsers: number;
  offlineUsers: number;
  postsCreated: number;
  textsReadToday: number;
};

export function AdminDashboard({
  initialRecommendation,
  initialOfficialChannel,
  initialQubicChannel,
  openAiConfigured,
}: {
  initialRecommendation: RecommendedReadingItem | null;
  initialOfficialChannel: OfficialChannelState;
  initialQubicChannel: QubicChannelState;
  openAiConfigured: boolean;
}) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncPending, setSyncPending] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState(initialRecommendation);
  const [recommendationPending, startRecommendationTransition] = useTransition();
  const [recommendationMessage, setRecommendationMessage] = useState<string | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [recommendationEditing, setRecommendationEditing] = useState(!initialRecommendation);
  const [adminView, setAdminView] = useState<AdminView>("operations");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/metrics", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const json = (await res.json()) as Metrics;
        if (alive) {
          setMetrics(json);
          setError(null);
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : "Unable to load metrics");
        }
      }
    }
    void load();
    const id = setInterval(() => void load(), 3000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  async function runUniversalXSync() {
    setSyncPending(true);
    setSyncMessage(null);
    setSyncError(null);
    try {
      const res = await fetch("/api/admin/x-sync", { method: "POST" });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; message?: string; error?: string } | null;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "Unable to run universal X sync.");
      }

      const now = Date.now();
      window.localStorage.setItem(X_SYNC_MANUAL_RESET_STORAGE_KEY, String(now));
      window.dispatchEvent(new Event("echonx:x-sync-manual-reset"));
      window.dispatchEvent(new Event("echonx:listening-queue-refresh"));
      setSyncMessage(json.message ?? "Universal X sync completed.");
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Unable to run universal X sync.");
    } finally {
      setSyncPending(false);
    }
  }

  function onRecommendationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const author = String(formData.get("author") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    setRecommendationMessage(null);
    setRecommendationError(null);
    startRecommendationTransition(async () => {
      const result = await saveEchonXReadingRecommendation(formData);
      if (!result.ok) {
        setRecommendationError(result.error ?? "Unable to save the recommendation.");
        return;
      }

      setRecommendationMessage(result.message ?? "Recommendation saved.");
      setRecommendation((current) =>
        current
          ? { ...current, title, author: author || null, description: description || null, updatedAt: new Date().toISOString() }
          : null,
      );
      setRecommendationEditing(false);
    });
  }

  return (
    <div className="admin-dashboard-stack">
      <header className="admin-page-hero">
        <h1 className="admin-page-title">Admin dashboard</h1>
        <p className="admin-page-lead">
          Operações, canais oficiais, biblioteca fixa e sync X. Métricas ao vivo a cada 3 s.
        </p>
      </header>

      <nav className="admin-view-tabs" aria-label="Secções do admin">
        <button
          type="button"
          className={cn("admin-view-tabs__btn", adminView === "operations" && "admin-view-tabs__btn--active")}
          onClick={() => setAdminView("operations")}
        >
          Operações
        </button>
        <button
          type="button"
          className={cn("admin-view-tabs__btn", adminView === "members" && "admin-view-tabs__btn--active")}
          onClick={() => setAdminView("members")}
        >
          Membros
        </button>
      </nav>

      {adminView === "members" ? (
        <AdminMembersPanel />
      ) : null}

      {adminView === "operations" ? (
        <>
      <AdminSection
        variant={openAiConfigured ? "default" : "alert"}
        title="AI Context (OpenAI)"
        description={
          openAiConfigured
            ? "OPENAI_API_KEY is set on this server. The AI Context button on posts can call OpenAI."
            : "OPENAI_API_KEY is missing. Add it in Vercel → Settings → Environment Variables (Production), then redeploy. Locally: .env.local."
        }
        icon={<Sparkles className={cn("h-4 w-4", openAiConfigured ? "text-primary" : "text-amber-400")} />}
      />

      <AdminSection
        variant="stats"
        title="Estatísticas ao vivo"
        description={error ? "Falha ao carregar métricas." : `Atualizado: ${metrics?.generatedAt ?? "…"}`}
        headCompact
      >
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="admin-stat-grid">
            <MetricTile
              icon={<Users className="h-3.5 w-3.5 text-primary" />}
              label="Usuários cadastrados"
              value={metrics?.registeredUsers}
              hint="Total · sem filtro de data"
            />
            <MetricTile
              icon={<Activity className="h-3.5 w-3.5 text-accent" />}
              label="Ativos (7 dias)"
              value={metrics?.activeUsers}
              hint="last_seen_at ≥ 7 dias"
            />
            <MetricTile
              icon={<Wifi className="h-3.5 w-3.5 text-emerald-400" />}
              label="Online agora"
              value={metrics?.onlineUsers}
              hint="last_seen_at · últimos 2 min"
            />
            <MetricTile
              icon={<WifiOff className="h-3.5 w-3.5 opacity-60" />}
              label="Fora do online"
              value={metrics?.offlineUsers}
              hint="cadastrados − online (2 min)"
            />
            <MetricTile
              icon={<FileText className="h-3.5 w-3.5 text-primary" />}
              label="Posts criados"
              value={metrics?.postsCreated}
              hint="Total · tabela posts"
            />
            <MetricTile
              icon={<BookOpen className="h-3.5 w-3.5 text-accent" />}
              label="Textos lidos hoje"
              value={metrics?.textsReadToday}
              hint="UTC · text_read_events"
            />
          </div>
        )}
      </AdminSection>

      <AdminSection
        variant="alert"
        title="Development Lab"
        description="Teste voz, biblioteca e futuras features em sandbox sem alterar o Audiopost em produção."
        icon={<FlaskConical className="h-4 w-4 text-amber-400" />}
        actions={
          <Button size="sm" variant="outline" className="border-amber-500/30" asChild>
            <Link href="/admin/lab">Open feature labs</Link>
          </Button>
        }
      />

      <AdminSection
        title="Documentação interna"
        description="Produto, Stripe/Library (§30), Library bar (§29) e backup Backupv1.4 — abre em nova aba."
        icon={<BookOpen className="h-4 w-4 text-primary" />}
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="gap-2">
            <Link href={ADMIN_DOC_LINKS.mainHtml} target="_blank" rel="noopener noreferrer">
              <FileText className="h-4 w-4" />
              Documento HTML
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link href={ADMIN_DOC_LINKS.hub} target="_blank" rel="noopener noreferrer">
              Índice
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link href={ADMIN_DOC_LINKS.libraryBillingSection} target="_blank" rel="noopener noreferrer">
              §30 Stripe/Library
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link href={ADMIN_DOC_LINKS.backupSection} target="_blank" rel="noopener noreferrer">
              Backupv1.4
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </Link>
          </Button>
        </div>
      </AdminSection>

      <AdminSection
        title="Sync X (timeline)"
        description="Sync manual: busca perfis X seguidos, enfileira posts novos e reinicia o timer de 30 min no cliente."
        actions={
          <Button size="sm" className="shrink-0 gap-2" onClick={() => void runUniversalXSync()} disabled={syncPending}>
            <RefreshCw className={syncPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {syncPending ? "Refreshing..." : "Refresh now"}
          </Button>
        }
      >
        {syncMessage || syncError ? (
          <p className={syncError ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
            {syncError ?? syncMessage}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Última ação aparece aqui após o refresh.</p>
        )}
      </AdminSection>

      <OfficialChannelAdmin initialChannel={initialOfficialChannel} />

      <QubicChannelAdmin initialChannel={initialQubicChannel} />

      <AdminSection
        title="EchonX Reading Recommendation"
        description="PDF ou TXT e capa fixos no topo da biblioteca Audiopost para todos os utilizadores."
      >
        <div className="space-y-4">
          {recommendation && !recommendationEditing ? (
            <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-background/60 p-3 sm:flex-row">
              <div className="relative aspect-[3/4] w-28 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {recommendation.coverUrl ? (
                  <img src={recommendation.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                    No cover
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-primary">Current EchonX pick</p>
                <h3 className="mt-1 text-lg font-semibold">{recommendation.title}</h3>
                <p className="text-sm text-muted-foreground">{recommendation.author ?? "EchonX"}</p>
                {recommendation.description ? (
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{recommendation.description}</p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  Document: {recommendation.documentType === "text" ? "TXT (plain text)" : "PDF"}
                </p>
                {recommendation.updatedAt ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Updated {new Date(recommendation.updatedAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                className="shrink-0 gap-2"
                onClick={() => {
                  setRecommendationMessage(null);
                  setRecommendationError(null);
                  setRecommendationEditing(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onRecommendationSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recommendation-title">Title</Label>
                  <Input
                    id="recommendation-title"
                    name="title"
                    defaultValue={recommendation?.title ?? ""}
                    placeholder="EchonX recommended reading"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recommendation-author">Author</Label>
                  <Input
                    id="recommendation-author"
                    name="author"
                    defaultValue={recommendation?.author ?? ""}
                    placeholder="Author or EchonX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommendation-description">Description</Label>
                <Textarea
                  id="recommendation-description"
                  name="description"
                  defaultValue={recommendation?.description ?? ""}
                  placeholder="Short note shown in the recommendation card."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recommendation-cover">Cover image</Label>
                  <Input id="recommendation-cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp" />
                  <p className="text-xs text-muted-foreground">JPG, PNG, or WebP up to 5 MB.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recommendation-document">Document (PDF or TXT)</Label>
                  <Input
                    id="recommendation-document"
                    name="document"
                    type="file"
                    accept="application/pdf,.pdf,text/plain,.txt"
                  />
                  <p className="text-xs text-muted-foreground">
                    PDF or UTF-8 .txt up to 25 MB. TXT is recommended for iPhone listening (same as Gutenberg
                    books). Required the first time; optional when updating title or cover only.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" className="gap-2" disabled={recommendationPending}>
                  <Upload className={recommendationPending ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
                  {recommendationPending ? "Saving..." : "Save recommendation"}
                </Button>
                {recommendation ? (
                  <Button type="button" variant="ghost" onClick={() => setRecommendationEditing(false)}>
                    Cancel
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">No fixed recommendation published yet.</span>
                )}
              </div>
            </form>
          )}

          {recommendationMessage ? <p className="text-sm text-muted-foreground">{recommendationMessage}</p> : null}
          {recommendationError ? <p className="text-sm text-destructive">{recommendationError}</p> : null}
        </div>
      </AdminSection>

      <p className="admin-footer-meta">EchonX Admin · acesso restrito</p>
        </>
      ) : null}
    </div>
  );
}

function AdminSection({
  title,
  description,
  icon,
  actions,
  variant = "default",
  headCompact = false,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  variant?: "default" | "alert" | "stats";
  headCompact?: boolean;
  children?: ReactNode;
}) {
  const panelClass =
    variant === "alert"
      ? "admin-panel admin-panel--alert"
      : variant === "stats"
        ? "admin-panel admin-panel--stats"
        : "admin-panel";

  return (
    <section className={panelClass}>
      <div className={cn("admin-panel__head", headCompact && "admin-panel__head--compact")}>
        <div>
          <div className="admin-panel__title-row">
            {icon}
            <h2>{title}</h2>
          </div>
          {description ? <p className="admin-panel__desc">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="admin-panel__body">{children}</div> : null}
    </section>
  );
}

function MetricTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value?: number;
  hint: string;
}) {
  return (
    <div className="admin-stat">
      <div className="flex items-center justify-between gap-2">
        <p className="admin-stat__label">{label}</p>
        {icon}
      </div>
      <p className="admin-stat__value">
        {typeof value === "number" ? value.toLocaleString("pt-BR") : "—"}
      </p>
      <p className="admin-stat__hint">{hint}</p>
    </div>
  );
}
