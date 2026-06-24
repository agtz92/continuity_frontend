"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import { useTranslations } from "next-intl";
import { ArrowLeft, Calendar, Copy, Info, RefreshCw } from "lucide-react";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { toast } from "@/lib/toast";
import {
  CALENDAR_INTEGRATION_QUERY,
  REGENERATE_CALENDAR_FEED_TOKEN,
  UPDATE_NOTIFICATION_SETTINGS,
} from "@/lib/graphql";

type CalendarIntegration = {
  feedUrl: string;
  syncTasks: boolean;
  syncRoutines: boolean;
};

export default function CalendarPluginPage() {
  const t = useTranslations("settings.plugins.calendar");

  const { data, refetch } = useQuery<{ calendarIntegration: CalendarIntegration }>(
    CALENDAR_INTEGRATION_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const ci = data?.calendarIntegration;

  return (
    <SettingsShell title={t("title")} description={t("description")}>
      <Link
        href="/settings/plugins"
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-text mb-4 text-sm group"
      >
        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
        Plugins
      </Link>

      <FeedSection feedUrl={ci?.feedUrl ?? ""} onChanged={refetch} />
      {ci && <IncludeSection ci={ci} onChanged={refetch} />}
    </SettingsShell>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface/50 border border-border rounded-xl p-5 mb-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-text mb-3">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-text">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
      />
    </label>
  );
}

function FeedSection({
  feedUrl,
  onChanged,
}: {
  feedUrl: string;
  onChanged: () => void;
}) {
  const t = useTranslations("settings.plugins.calendar");
  const [regenerate, { loading }] = useMutation(REGENERATE_CALENDAR_FEED_TOKEN, {
    onCompleted: () => {
      toast.success(t("regenerated"));
      onChanged();
    },
  });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      toast.success(t("copied"));
    } catch {
      /* ignore */
    }
  };

  return (
    <Section icon={<Calendar size={16} className="text-accent" />} title={t("feedTitle")}>
      <p className="text-xs text-text-muted mb-3">{t("feedBody")}</p>
      <div className="text-[11px] uppercase tracking-wider text-text-muted mb-1">
        {t("feedUrlLabel")}
      </div>
      <div className="flex gap-2 mb-3">
        <input
          readOnly
          value={feedUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 bg-border border border-border rounded-lg px-3 py-2 text-sm font-mono text-xs"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-accent text-bg rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Copy size={14} />
          {t("copyButton")}
        </button>
        <button
          type="button"
          onClick={() => regenerate()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-border rounded-lg text-sm text-text-muted hover:opacity-80 disabled:opacity-50"
        >
          <RefreshCw size={14} />
          {t("regenerate")}
        </button>
      </div>
      <div className="space-y-2 text-xs text-text-muted">
        <div>
          <span className="text-text font-medium">{t("howIosTitle")}: </span>
          {t("howIos")}
        </div>
        <div>
          <span className="text-text font-medium">{t("howGoogleTitle")}: </span>
          {t("howGoogle")}
        </div>
      </div>
      <div className="mt-3 flex gap-2 text-xs text-text-muted bg-border/40 border border-border rounded-lg px-3 py-2">
        <Info size={14} className="shrink-0 mt-0.5" />
        <span>{t("latencyNote")}</span>
      </div>
    </Section>
  );
}

function IncludeSection({
  ci,
  onChanged,
}: {
  ci: CalendarIntegration;
  onChanged: () => void;
}) {
  const t = useTranslations("settings.plugins.calendar");
  const [update, { loading }] = useMutation(UPDATE_NOTIFICATION_SETTINGS, {
    onCompleted: onChanged,
  });
  const save = (data: Record<string, unknown>) =>
    update({ variables: { data } }).catch(() => {});

  return (
    <Section title={t("syncTitle")}>
      <ToggleRow
        label={t("syncTasks")}
        checked={ci.syncTasks}
        disabled={loading}
        onChange={(v) => save({ calendarSyncTasks: v })}
      />
      <ToggleRow
        label={t("syncRoutines")}
        checked={ci.syncRoutines}
        disabled={loading}
        onChange={(v) => save({ calendarSyncRoutines: v })}
      />
    </Section>
  );
}
