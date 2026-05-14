"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Activity, BookOpen, FileText, Users, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Metrics = {
  generatedAt: string;
  registeredUsers: number;
  activeUsers: number;
  onlineUsers: number;
  offlineUsers: number;
  postsCreated: number;
  textsReadToday: number;
};

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Admin dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Indicadores ao vivo a partir do Supabase (atualização a cada 3 segundos). Acesso restrito a contas com{" "}
          <span className="font-mono text-[11px]">role = admin</span> na tabela <span className="font-mono text-[11px]">profiles</span>.
        </p>
      </div>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Métricas indisponíveis</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile
          icon={<Users className="h-4 w-4 text-primary" />}
          label="Usuários cadastrados"
          value={metrics?.registeredUsers}
          hint="Linhas em profiles"
        />
        <MetricTile
          icon={<Activity className="h-4 w-4 text-accent" />}
          label="Usuários ativos (7 dias)"
          value={metrics?.activeUsers}
          hint="last_seen_at nos últimos 7 dias"
        />
        <MetricTile
          icon={<Wifi className="h-4 w-4 text-emerald-400" />}
          label="Online agora"
          value={metrics?.onlineUsers}
          hint="last_seen_at nos últimos 2 minutos"
        />
        <MetricTile
          icon={<WifiOff className="h-4 w-4 text-muted-foreground" />}
          label="Offline"
          value={metrics?.offlineUsers}
          hint="Cadastrados menos online (2 min)"
        />
        <MetricTile
          icon={<FileText className="h-4 w-4 text-primary" />}
          label="Posts criados"
          value={metrics?.postsCreated}
          hint="Total na tabela posts"
        />
        <MetricTile
          icon={<BookOpen className="h-4 w-4 text-accent" />}
          label="Textos lidos hoje (UTC)"
          value={metrics?.textsReadToday}
          hint="Eventos em text_read_events desde meia-noite UTC"
        />
      </div>

      <Separator />

      <p className="text-xs text-muted-foreground">
        Última atualização: {metrics?.generatedAt ?? "carregando…"}
      </p>
    </div>
  );
}

function MetricTile({
  icon,
  label,
  value,
  suffix,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value?: number;
  suffix?: string;
  hint: string;
}) {
  return (
    <Card className="border-border/80 bg-card/70">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">
          {typeof value === "number" ? value.toLocaleString("pt-BR") : "—"}
          {suffix && typeof value === "number" ? suffix : null}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
