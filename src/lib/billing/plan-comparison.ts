import type { PlanTier } from "@/lib/plans";

export type ComparisonCell = boolean | string;

export type ComparisonRow = {
  feature: string;
  starter: ComparisonCell;
  popular: ComparisonCell;
  pro: ComparisonCell;
};

export const BILLING_COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "Unlimited native EchonX profiles",
    starter: true,
    popular: true,
    pro: true,
  },
  {
    feature: "External X profiles",
    starter: "Up to 3",
    popular: "Up to 5",
    pro: "Up to 15",
  },
  {
    feature: "Posts with moderation & compression",
    starter: true,
    popular: true,
    pro: true,
  },
  {
    feature: "Automatic queue for new posts",
    starter: true,
    popular: true,
    pro: true,
  },
  {
    feature: "Priority audio handling",
    starter: false,
    popular: true,
    pro: true,
  },
  {
    feature: "Audio comments (Pro exclusive)",
    starter: false,
    popular: false,
    pro: true,
  },
  {
    feature: "Advanced moderation telemetry",
    starter: false,
    popular: false,
    pro: true,
  },
  {
    feature: "Priority support",
    starter: false,
    popular: false,
    pro: true,
  },
];

export const BILLING_FAQ = [
  {
    id: "limit",
    question: "What happens if I go over my external profile limit?",
    answer:
      "You cannot add more external X accounts until you upgrade or remove a followed profile. Your existing follows and native EchonX listening stay available.",
  },
  {
    id: "cancel",
    question: "Can I change or cancel my plan anytime?",
    answer:
      "Yes. You can upgrade, downgrade, or cancel from billing settings. Changes apply according to your billing period once Stripe checkout is connected.",
  },
  {
    id: "secure",
    question: "Is my payment information secure?",
    answer:
      "Payments are processed by Stripe. EchonX does not store your full card number on our servers.",
  },
  {
    id: "renew",
    question: "Does my plan renew automatically?",
    answer:
      "Paid plans renew each billing period unless you cancel. You will receive confirmation before any future auto-renewal flows go live.",
  },
] as const;

export const PAID_PLAN_IDS: PlanTier[] = ["starter", "popular", "pro"];
