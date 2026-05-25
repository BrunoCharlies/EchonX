"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ExternalLink, UserPlus, Users } from "lucide-react";
import type { AdminMemberRecord, AdminMembersPayload } from "@/lib/admin/load-admin-members";
import { cn } from "@/lib/utils";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function memberLabel(member: AdminMemberRecord) {
  return member.displayName || member.username || member.email || "Sem nome";
}

function MemberRow({ member }: { member: AdminMemberRecord }) {
  return (
    <tr className="admin-members-table__row">
      <td className="admin-members-table__cell">
        <div className="admin-members-table__primary">{memberLabel(member)}</div>
        {member.username ? (
          <div className="admin-members-table__secondary">@{member.username}</div>
        ) : null}
      </td>
      <td className="admin-members-table__cell admin-members-table__cell--muted">
        {member.email ?? "—"}
      </td>
      <td className="admin-members-table__cell admin-members-table__cell--muted">
        {formatWhen(member.createdAt)}
      </td>
      <td className="admin-members-table__cell admin-members-table__cell--muted">
        {member.lastSeenAt ? formatWhen(member.lastSeenAt) : "—"}
      </td>
      <td className="admin-members-table__cell">
        <span
          className={cn(
            "admin-members-role",
            member.role === "admin" && "admin-members-role--admin",
          )}
        >
          {member.role === "admin" ? "Admin" : "Membro"}
        </span>
      </td>
      <td className="admin-members-table__cell admin-members-table__cell--action">
        {member.profileHref ? (
          <Link
            href={member.profileHref}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-members-link"
          >
            Perfil
            <ExternalLink className="h-3 w-3" />
          </Link>
        ) : (
          <span className="admin-members-table__secondary">—</span>
        )}
      </td>
    </tr>
  );
}

function RecentSignupCard({ member, index }: { member: AdminMemberRecord; index: number }) {
  return (
    <li className="admin-recent-signup">
      <span className="admin-recent-signup__rank">{index + 1}</span>
      <div className="admin-recent-signup__body">
        <p className="admin-recent-signup__name">{memberLabel(member)}</p>
        <p className="admin-recent-signup__meta">
          {member.username ? `@${member.username}` : null}
          {member.username && member.email ? " · " : null}
          {member.email ?? (!member.username ? "Sem e-mail" : null)}
        </p>
        <p className="admin-recent-signup__when">Cadastro: {formatWhen(member.createdAt)}</p>
      </div>
      {member.profileHref ? (
        <Link
          href={member.profileHref}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-members-link admin-recent-signup__link"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </li>
  );
}

export function AdminMembersPanel() {
  const [data, setData] = useState<AdminMembersPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/members", { cache: "no-store" });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Não foi possível carregar os membros.");
        }
        const json = (await res.json()) as AdminMembersPayload;
        if (alive) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : "Erro ao carregar membros.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const recent = data?.recent ?? [];
  const members = data?.members ?? [];

  return (
    <div className="admin-members-stack">
      <section className="admin-panel admin-panel--alert admin-recent-alert">
        <div className="admin-panel__head admin-panel__head--compact">
          <div>
            <div className="admin-panel__title-row">
              <UserPlus className="h-4 w-4 text-amber-400" />
              <h2>Últimos cadastros</h2>
            </div>
            <p className="admin-panel__desc">
              Os 5 membros nativos mais recentes na plataforma (conta EchonX).
              {data ? ` Total: ${data.total.toLocaleString("pt-BR")} membros.` : null}
            </p>
          </div>
        </div>
        <div className="admin-panel__body">
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : error ? (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não há cadastros nativos.</p>
          ) : (
            <ol className="admin-recent-signups">
              {recent.map((member, index) => (
                <RecentSignupCard key={member.id} member={member} index={index} />
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="admin-panel admin-members-panel">
        <div className="admin-panel__head admin-panel__head--compact">
          <div>
            <div className="admin-panel__title-row">
              <Users className="h-4 w-4 text-primary" />
              <h2>Membros</h2>
            </div>
            <p className="admin-panel__desc">
              Todos os membros nativos
              {data ? ` (${data.total.toLocaleString("pt-BR")})` : ""}. Visível apenas nesta área Admin.
            </p>
          </div>
        </div>
        <div className="admin-panel__body">
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar lista…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum membro encontrado.</p>
          ) : (
            <div className="admin-members-table-wrap">
              <table className="admin-members-table">
                <thead>
                  <tr>
                    <th>Membro</th>
                    <th>E-mail</th>
                    <th>Cadastro</th>
                    <th>Última atividade</th>
                    <th>Papel</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <MemberRow key={member.id} member={member} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data?.generatedAt ? (
            <p className="admin-members-footnote">Atualizado: {formatWhen(data.generatedAt)}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
