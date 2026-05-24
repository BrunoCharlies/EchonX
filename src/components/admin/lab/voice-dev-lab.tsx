"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FloatingListenPlayer } from "@/components/listen/floating-listen-player";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useListenQueue } from "@/components/listen/listen-queue-provider";
import { getLabVoiceEngine, resetLabVoiceEngine, setLabVoiceMode } from "@/lib/voice/lab-voice-session";

type FishStatus = {
  configured: boolean;
  model?: string;
  surface?: string;
};

type QueueMeta = {
  followCount: number;
  pendingRows: number;
  consumedRows: number;
  filteredByPlan: number;
  hint: string;
};

function queueHintMessage(meta: QueueMeta | null): string | null {
  if (!meta) return null;
  switch (meta.hint) {
    case "no_follows":
      return "Você não segue perfis no /app. Siga @qubic (ou outros) em Audiopost e sincronize.";
    case "ok_admin_sandbox":
      return `${meta.filteredByPlan} item(ns) seriam bloqueados no /app (plano Free), mas o lab admin reproduz todos para teste de voz.`;
    case "blocked_by_plan":
      return `${meta.filteredByPlan} item(ns) na fila exigem plano pago (perfis X custom). Oficial @qubic é grátis.`;
    case "all_consumed_or_no_new_posts":
      return meta.consumedRows > 0
        ? `${meta.consumedRows} post(s) já foram reproduzidos (consumed). Use “Sincronizar X” para buscar posts novos.`
        : "Fila vazia: sincronize perfis X para importar posts.";
    case "sync_x_profiles":
      return "Nenhum post pendente. Clique em “Sincronizar X” para importar da API do X.";
    default:
      return null;
  }
}

/**
 * Sandbox for Audiopost queue voice (Fish S2 Pro). Library uses a separate product path later.
 */
export function VoiceDevLab() {
  const { items, refresh } = useListenQueue();
  const [fishStatus, setFishStatus] = useState<FishStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [ttsProbe, setTtsProbe] = useState<"idle" | "ok" | "fail">("idle");
  const [ttsProbeError, setTtsProbeError] = useState<string | null>(null);
  const [queueMeta, setQueueMeta] = useState<QueueMeta | null>(null);
  const [queueBusy, setQueueBusy] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setStatusError(null);
    try {
      const res = await fetch("/api/admin/lab/tts");
      if (!res.ok) {
        setFishStatus({ configured: false });
        setStatusError(`Status ${res.status}`);
        return;
      }
      const data = (await res.json()) as FishStatus;
      setFishStatus(data);
      setLabVoiceMode(data.configured ? "fish" : "web-speech");
      resetLabVoiceEngine();
      if (data.configured) {
        const probe = await fetch("/api/admin/lab/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "EchonX lab test.", lang: "en-US" }),
        });
        if (probe.ok && (probe.headers.get("Content-Type") ?? "").includes("audio")) {
          setTtsProbe("ok");
          setTtsProbeError(null);
        } else {
          let err = await probe.text();
          try {
            const j = JSON.parse(err) as { error?: string };
            err = j.error ?? err;
          } catch {
            /* text */
          }
          setTtsProbe("fail");
          setTtsProbeError(err || `HTTP ${probe.status}`);
        }
      } else {
        setTtsProbe("idle");
        setTtsProbeError(null);
      }
    } catch (err) {
      setFishStatus({ configured: false });
      setStatusError(err instanceof Error ? err.message : "Could not reach lab TTS API.");
      setTtsProbe("idle");
      setTtsProbeError(null);
      setLabVoiceMode("web-speech");
      resetLabVoiceEngine();
    }
  }, []);

  const refreshQueueDiagnostics = useCallback(async () => {
    setQueueError(null);
    try {
      const res = await fetch("/api/admin/lab/queue", { cache: "no-store" });
      if (!res.ok) {
        setQueueMeta(null);
        setQueueError(`Fila: HTTP ${res.status}`);
        await refresh();
        return;
      }
      const json = (await res.json()) as { items?: typeof items; meta?: QueueMeta };
      if (json.meta) setQueueMeta(json.meta);
      await refresh();
    } catch (err) {
      setQueueError(err instanceof Error ? err.message : "Não foi possível carregar a fila.");
      await refresh();
    }
  }, [refresh]);

  const backfillLegacyIntros = useCallback(async () => {
    setQueueBusy(true);
    setBackfillMessage(null);
    setQueueError(null);
    try {
      const res = await fetch("/api/admin/lab/backfill-intros", { method: "POST" });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        updated?: number;
        scanned?: number;
        samples?: Array<{ before: string; after: string }>;
      };
      if (!res.ok || !json.ok) {
        setQueueError(json.error ?? json.message ?? `Backfill falhou (${res.status})`);
      } else {
        const preview = json.samples?.[0]
          ? ` Ex.: "${json.samples[0].before.slice(0, 40)}…" → "${json.samples[0].after.slice(0, 40)}…"`
          : "";
        setBackfillMessage((json.message ?? `Atualizados ${json.updated ?? 0} post(s).`) + preview);
      }
      await refreshQueueDiagnostics();
    } catch (err) {
      setQueueError(err instanceof Error ? err.message : "Backfill falhou.");
    } finally {
      setQueueBusy(false);
    }
  }, [refreshQueueDiagnostics]);

  const syncXAndRefresh = useCallback(async () => {
    setQueueBusy(true);
    setQueueError(null);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/x/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "manual" }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string; error?: string; imported?: number };
      if (!res.ok || json.ok === false) {
        setQueueError(json.error ?? json.message ?? `Sync falhou (${res.status})`);
      } else {
        setSyncMessage(json.message ?? (json.imported ? `Importados ${json.imported} post(s).` : "Nenhum post novo."));
      }
      await refreshQueueDiagnostics();
    } catch (err) {
      setQueueError(err instanceof Error ? err.message : "Sync X falhou.");
    } finally {
      setQueueBusy(false);
    }
  }, [refreshQueueDiagnostics]);

  useEffect(() => {
    void loadStatus();
    void refreshQueueDiagnostics();
  }, [loadStatus, refreshQueueDiagnostics]);

  const queueHint = queueHintMessage(queueMeta);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Voice development (Audiopost)</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Tests the <strong>queue / Now Playing</strong> player with Fish Audio S2 Pro when{" "}
          <code className="text-xs">FISH_AUDIO_API_KEY</code> is set. Mirrored X posts use{" "}
          <strong>Post by …</strong> (English) at import — run <strong>Sincronizar X</strong> once to rewrite legacy{" "}
          <em>postou</em> lines in the database.
        </p>
      </div>

      <Card className={fishStatus?.configured ? "border-emerald-500/40" : "border-amber-500/40"}>
        <CardHeader>
          <CardTitle className="text-base">Fish Audio (lab)</CardTitle>
          <CardDescription>
            {fishStatus?.configured
              ? `API ready · model ${fishStatus.model ?? "s2-pro"} · proxy POST /api/admin/lab/tts`
              : "Add FISH_AUDIO_API_KEY to .env.local, restart dev server, then Refresh status."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          {statusError ? <p className="text-destructive">{statusError}</p> : null}
          {ttsProbe === "ok" ? (
            <p className="text-emerald-400">Teste TTS OK — áudio MP3 recebido da Fish.</p>
          ) : null}
          {ttsProbe === "fail" ? (
            <p className="text-destructive">
              Teste TTS falhou: {ttsProbeError}. Se for saldo, recarregue a <strong>wallet da API</strong> no site Fish
              (Developers / billing), não só o plano Plus.
            </p>
          ) : null}
          <button
            type="button"
            className="text-primary underline"
            onClick={() => {
              void loadStatus();
            }}
          >
            Atualizar status Fish
          </button>
          <span className="text-muted-foreground/80"> (não atualiza a fila de posts)</span>
          <p>
            Optional voice models: <code>FISH_AUDIO_REFERENCE_ID_EN</code>,{" "}
            <code>FISH_AUDIO_REFERENCE_ID_PT_BR</code> (see .env.example).
          </p>
        </CardContent>
      </Card>

      <Card className={items.length === 0 ? "border-amber-500/40" : "border-border/60"}>
        <CardHeader>
          <CardTitle className="text-base">Fila de audiopost</CardTitle>
          <CardDescription>
            {items.length === 0
              ? "Nenhum item reproduzível na fila. Use os botões abaixo (não confunda com “Atualizar status Fish”)."
              : `${items.length} item(ns) no reprodutor (admin ignora limite Free no lab) · /api/listening/queue`}
            {queueMeta ? (
              <>
                <br />
                <span className="text-muted-foreground/90">
                  Seguindo {queueMeta.followCount} perfil(is) · {queueMeta.pendingRows} na fila DB ·{" "}
                  {queueMeta.consumedRows} já reproduzidos
                  {queueMeta.filteredByPlan > 0 ? ` · ${queueMeta.filteredByPlan} bloqueados pelo plano` : null}
                </span>
              </>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {queueHint ? <p className="text-amber-200/90">{queueHint}</p> : null}
          {queueError ? <p className="text-destructive">{queueError}</p> : null}
          {syncMessage ? <p className="text-emerald-400">{syncMessage}</p> : null}
          {backfillMessage ? <p className="text-emerald-400">{backfillMessage}</p> : null}
          <p className="text-muted-foreground/90">
            Posts antigos na fila mantêm <em>postou</em> no banco até o backfill abaixo (sync X só atualiza os ~10
            tweets mais recentes por perfil).
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="text-primary underline disabled:opacity-50"
              disabled={queueBusy}
              onClick={() => void refreshQueueDiagnostics()}
            >
              Atualizar fila
            </button>
            <button
              type="button"
              className="text-primary underline disabled:opacity-50"
              disabled={queueBusy}
              onClick={() => void syncXAndRefresh()}
            >
              {queueBusy ? "Sincronizando…" : "Sincronizar X e atualizar fila"}
            </button>
            <button
              type="button"
              className="text-primary underline disabled:opacity-50"
              disabled={queueBusy}
              onClick={() => void backfillLegacyIntros()}
            >
              {queueBusy ? "Corrigindo…" : "Corrigir postou → Post by (fila antiga)"}
            </button>
            <Link href="/app" className="text-primary underline">
              Abrir Audiopost
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed border-amber-500/30 bg-card/40">
        <CardHeader>
          <CardTitle className="text-base">Workflow</CardTitle>
          <CardDescription>
            1) Validate quality here (pt-BR + en-US posts from /app queue).
            <br />
            2) Promote engine to production Audiopost when approved (paid plans only).
            <br />
            3) Library Premium Fish stays on biblioteca routes + byte quota (300k / US$ 9).
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Pricing doc:{" "}
          <Link href="/docs/html/2026-05-qubic-echonx-moeda-assinatura.html#precificacao-voz-2026" className="text-primary underline">
            HTML §27
          </Link>
          .           Production /app still uses Web Speech until entitlements are connected.
        </CardContent>
      </Card>

      {ttsProbe === "fail" ? (
        <p className="text-xs text-muted-foreground">
          Enquanto não houver saldo API, pode testar a fila com{" "}
          <button
            type="button"
            className="text-primary underline"
            onClick={() => {
              setLabVoiceMode("web-speech");
              resetLabVoiceEngine();
            }}
          >
            Web Speech (browser)
          </button>{" "}
          — botão acima força fallback local sem Fish.
        </p>
      ) : null}

      <div className="relative mx-auto max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#03070d] shadow-xl">
        <FloatingListenPlayer
          variant="embedded"
          className="relative !bottom-auto !right-auto w-full"
          getVoiceEngine={getLabVoiceEngine}
          labSandbox
          defaultPlaybackLanguage="original"
          ignoreStoredPlaybackLanguage
        />
      </div>
    </div>
  );
}
