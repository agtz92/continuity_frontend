"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { useTranslations } from "next-intl";
import { AlertTriangle, Info, X, XCircle } from "lucide-react";
import { NOTIFICATIONS_QUERY } from "@/lib/graphql";

type Severity = "info" | "warn" | "error";

type InAppNotification = {
  id: string;
  kind: string;
  severity: Severity;
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  dismissible: boolean;
  i18nKind: string | null;
  i18nVarsJson: string | null;
};

const DISMISS_KEY = "continuity:dismissed_notifications";

function loadDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISMISS_KEY, JSON.stringify(Array.from(ids)));
}

export function NotificationStack() {
  const { data } = useQuery<{ notifications: InAppNotification[] }>(
    NOTIFICATIONS_QUERY,
    { fetchPolicy: "cache-and-network", pollInterval: 60_000 }
  );
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDismissed(loadDismissed());
  }, []);

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    saveDismissed(next);
  };

  const items = (data?.notifications ?? []).filter(
    (n) => !n.dismissible || !dismissed.has(n.id)
  );

  if (items.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {items.map((n) => (
        <NotificationCard key={n.id} n={n} onDismiss={() => dismiss(n.id)} />
      ))}
    </div>
  );
}

function NotificationCard({
  n,
  onDismiss,
}: {
  n: InAppNotification;
  onDismiss: () => void;
}) {
  const tDerived = useTranslations("notifications");
  const tCommon = useTranslations("notifications");

  const { title, body, ctaLabel, ctaUrl } = resolveCopy(n, tDerived);

  const palette = severityPalette(n.severity);
  const Icon = severityIcon(n.severity);

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 ${palette.bg} ${palette.border}`}
    >
      <Icon size={18} className={`mt-0.5 shrink-0 ${palette.icon}`} />
      <div className="flex-1 min-w-0">
        {title && (
          <div className={`text-sm font-semibold ${palette.title}`}>{title}</div>
        )}
        {body && (
          <div className={`text-sm leading-snug mt-0.5 ${palette.body}`}>
            {body}
          </div>
        )}
        {ctaUrl && ctaLabel && (
          <a
            href={ctaUrl}
            className={`inline-block mt-2 text-sm font-medium underline underline-offset-2 ${palette.cta}`}
          >
            {ctaLabel}
          </a>
        )}
      </div>
      {n.dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={tCommon("dismiss")}
          className={`shrink-0 ${palette.icon} hover:opacity-80`}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

function resolveCopy(
  n: InAppNotification,
  t: ReturnType<typeof useTranslations>
): { title: string; body: string; ctaLabel: string; ctaUrl: string } {
  // Announcements: title/body come literal from admin.
  const isDerived =
    (n.kind === "quota_over" || n.kind === "quota_will_exceed") && n.i18nKind;
  if (!isDerived) {
    return {
      title: n.title,
      body: n.body,
      ctaLabel: n.ctaLabel,
      ctaUrl: n.ctaUrl,
    };
  }
  // Derived: resolve i18n key with interpolation vars.
  let vars: Record<string, string | number> = {};
  try {
    vars = n.i18nVarsJson ? JSON.parse(n.i18nVarsJson) : {};
  } catch {
    vars = {};
  }
  // Format ISO date for human display in the user's locale.
  if (typeof vars.date_iso === "string" && vars.date_iso) {
    try {
      vars.date = new Date(vars.date_iso).toLocaleDateString();
    } catch {
      vars.date = vars.date_iso;
    }
  }
  const baseSection =
    n.kind === "quota_will_exceed" ? "quotaWillExceed" : "quotaOver";
  const baseKey = `${baseSection}.${n.i18nKind}`;
  const safe = (k: string) => {
    try {
      return t(`${baseKey}.${k}`, vars as Record<string, string | number>);
    } catch {
      return "";
    }
  };
  const routeByKind: Record<string, string> = {
    projects: "/dashboard?tab=projects",
    tasks_total: "/dashboard?tab=tasks",
    routines: "/dashboard?tab=routines",
    ideas: "/dashboard?tab=ideas",
    categories: "/settings/profile",
  };
  return {
    title: safe("title"),
    body: safe("body"),
    ctaLabel: safe("cta"),
    ctaUrl: routeByKind[n.i18nKind!] ?? "/dashboard",
  };
}

function severityPalette(severity: Severity) {
  switch (severity) {
    case "error":
      return {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        icon: "text-red-600 dark:text-red-400",
        title: "text-red-900 dark:text-red-100",
        body: "text-red-800/90 dark:text-red-200/90",
        cta: "text-red-700 dark:text-red-300",
      };
    case "warn":
      return {
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        icon: "text-amber-600 dark:text-amber-400",
        title: "text-amber-900 dark:text-amber-100",
        body: "text-amber-800/90 dark:text-amber-200/90",
        cta: "text-amber-700 dark:text-amber-300",
      };
    case "info":
    default:
      return {
        bg: "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]",
        border:
          "border-[color-mix(in_srgb,var(--accent)_30%,transparent)]",
        icon: "text-accent",
        title: "text-text",
        body: "text-text-muted",
        cta: "text-accent",
      };
  }
}

function severityIcon(severity: Severity) {
  switch (severity) {
    case "error":
      return XCircle;
    case "warn":
      return AlertTriangle;
    case "info":
    default:
      return Info;
  }
}
