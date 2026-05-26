export type ExplainerStatus = "draft" | "awaiting-input" | "stable";

export type ExplainerPage = {
  slug: string;
  title: string;
  summary: string;
  /** Full HTML doc served from /public/docs/html */
  htmlHref: string;
  status: ExplainerStatus;
  updated: string;
  tags: string[];
};

/** Registry of temporary insight pages (dev / product understanding only). */
export const EXPLAINER_PAGES: ExplainerPage[] = [
  {
    slug: "qubic-moeda-assinatura",
    title: "Qubic, QPI e moeda EchonX",
    summary:
      "Perfil intelligence §42; Lumos profile; native vs external; backup §43 (v1.11).",
    htmlHref: "/docs/html/2026-05-qubic-echonx-moeda-assinatura.html#native-profile-intelligence-maio-2026",
    status: "stable",
    updated: "Maio 2026",
    tags: ["qubic", "blockchain", "economia"],
  },
];

/** Links for admin panel — internal docs only (not marketing). */
export const ADMIN_DOC_LINKS = {
  hub: "/docs/html/readme",
  mainHtml: "/docs/html/2026-05-qubic-echonx-moeda-assinatura.html",
  voicePricingSection: "/docs/html/2026-05-qubic-echonx-moeda-assinatura.html#precificacao-voz-2026",
  libraryBillingSection: "/docs/html/2026-05-qubic-echonx-moeda-assinatura.html#stripe-library-billing-maio-2026",
  backupSection: "/docs/html/2026-05-qubic-echonx-moeda-assinatura.html#backup-v1-11",
  nativeProfileSection:
    "/docs/html/2026-05-qubic-echonx-moeda-assinatura.html#native-profile-intelligence-maio-2026",
  libraryUpdatesSection:
    "/docs/html/2026-05-qubic-echonx-moeda-assinatura.html#atualizacoes-library-xprofiles-maio-2026",
  projectHoursSection:
    "/docs/html/2026-05-qubic-echonx-moeda-assinatura.html#horas-projeto-maio-2026",
  ga4Section:
    "/docs/html/2026-05-qubic-echonx-moeda-assinatura.html#google-analytics-ga4-maio-2026",
  agentSection:
    "/docs/html/2026-05-qubic-echonx-moeda-assinatura.html#echonx-agent-maio-2026",
  agentPlaybookSection:
    "/docs/html/2026-05-qubic-echonx-moeda-assinatura.html#agent-playbook-full",
} as const;

export const EXPLAINER_STATUS_LABEL: Record<ExplainerStatus, string> = {
  draft: "Rascunho",
  "awaiting-input": "Aguardando suas respostas",
  stable: "Estável",
};
