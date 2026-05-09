"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import {
  DISCONNECT_CHANNEL,
  NOTIFICATION_SETTINGS_QUERY,
  REQUEST_CHANNEL_LINK,
  UPDATE_NOTIFICATION_SETTINGS,
} from "@/lib/graphql";
import { toast } from "@/lib/toast";

type Channel = "telegram" | "whatsapp";

type Link = {
  channel: Channel;
  connected: boolean;
  verifiedAt: string | null;
};

type Settings = {
  locale: string;
  timezone: string;
  digestEnabled: boolean;
  digestDayOfWeek: number;
  digestHour: number;
  sleepingAlertsEnabled: boolean;
  dueRemindersEnabled: boolean;
  dueReminderLeadHours: number;
  manualEnabled: boolean;
  isAdmin: boolean;
  links: Link[];
};

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function NotificationSettings() {
  const t = useTranslations("settings.notifications");
  const tCommon = useTranslations("common");
  const tWeekday = useTranslations("analytics.weekday.labels");

  const { data, loading, refetch } = useQuery<{ notificationSettings: Settings }>(
    NOTIFICATION_SETTINGS_QUERY,
    { fetchPolicy: "cache-and-network" }
  );
  const [updateSettings, { loading: saving }] = useMutation(
    UPDATE_NOTIFICATION_SETTINGS
  );
  const [requestLink, { loading: linking }] = useMutation(REQUEST_CHANNEL_LINK);
  const [disconnect] = useMutation(DISCONNECT_CHANNEL);

  const settings = data?.notificationSettings;
  const telegramLink = useMemo<Link | undefined>(
    () => settings?.links.find((l) => l.channel === "telegram"),
    [settings]
  );

  const [pollingForLink, setPollingForLink] = useState(false);

  useEffect(() => {
    if (!pollingForLink) return;
    const id = setInterval(() => {
      refetch().catch(() => {});
    }, 3000);
    const timeout = setTimeout(() => setPollingForLink(false), 5 * 60 * 1000);
    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, [pollingForLink, refetch]);

  useEffect(() => {
    if (telegramLink?.connected) setPollingForLink(false);
  }, [telegramLink?.connected]);

  if (loading && !settings) {
    return (
      <div className="text-zinc-400 flex items-center gap-2">
        <Loader2 className="animate-spin" size={16} /> {tCommon("loading")}
      </div>
    );
  }

  if (!settings) return null;

  const onSave = async (patch: Partial<Settings>) => {
    try {
      await updateSettings({ variables: { data: patch } });
      toast.success(tCommon("saved"));
    } catch {
      // error link already shows toast
    }
  };

  const onConnectTelegram = async () => {
    try {
      const res = await requestLink({
        variables: { channel: "TELEGRAM" },
      });
      const deepLink = res.data?.requestChannelLink?.deepLink;
      if (deepLink) {
        window.open(deepLink, "_blank", "noopener,noreferrer");
        setPollingForLink(true);
      }
    } catch {
      // error link toast
    }
  };

  const onDisconnectTelegram = async () => {
    if (!confirm(t("channel.disconnectConfirm"))) return;
    await disconnect({ variables: { channel: "TELEGRAM" } });
    await refetch();
    toast.success(t("channel.disconnected"));
  };

  return (
    <div>
      <Section title={t("channels")}>
        <ChannelRow
          name={t("telegram")}
          connected={!!telegramLink?.connected}
          waiting={pollingForLink}
          onConnect={onConnectTelegram}
          onDisconnect={onDisconnectTelegram}
          connecting={linking}
          labels={{
            connected: t("channel.connected"),
            waiting: t("channel.waiting"),
            notConnected: t("channel.notConnected"),
            connect: t("channel.connect"),
            disconnect: t("channel.disconnect"),
          }}
        />
        <p className="text-xs text-zinc-500 mt-3">{t("whatsappSoon")}</p>
      </Section>

      <Section title={t("weeklyDigest")}>
        <ToggleRow
          label={t("weeklyDigestToggle")}
          checked={settings.digestEnabled}
          onChange={(v) => onSave({ digestEnabled: v })}
          disabled={saving}
        />
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Field label={t("day")}>
            <select
              value={settings.digestDayOfWeek}
              onChange={(e) =>
                onSave({ digestDayOfWeek: parseInt(e.target.value, 10) })
              }
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
              disabled={saving || !settings.digestEnabled}
            >
              {DAY_KEYS.map((key, i) => (
                <option key={key} value={i}>
                  {tWeekday(key)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("hour")}>
            <select
              value={settings.digestHour}
              onChange={(e) =>
                onSave({ digestHour: parseInt(e.target.value, 10) })
              }
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
              disabled={saving || !settings.digestEnabled}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={t("timezone")}>
          <input
            value={settings.timezone}
            onChange={(e) => onSave({ timezone: e.target.value })}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm w-full"
            disabled={saving}
            placeholder="America/Mexico_City"
          />
        </Field>
      </Section>

      <Section title={t("otherNotifications")}>
        <ToggleRow
          label={t("sleepingAlertsToggle")}
          checked={settings.sleepingAlertsEnabled}
          onChange={(v) => onSave({ sleepingAlertsEnabled: v })}
          disabled={saving}
        />
        <ToggleRow
          label={t("dueRemindersToggle")}
          checked={settings.dueRemindersEnabled}
          onChange={(v) => onSave({ dueRemindersEnabled: v })}
          disabled={saving}
        />
        <Field label={t("leadTime")}>
          <input
            type="number"
            min={1}
            max={168}
            value={settings.dueReminderLeadHours}
            onChange={(e) =>
              onSave({ dueReminderLeadHours: parseInt(e.target.value, 10) || 24 })
            }
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm w-32"
            disabled={saving || !settings.dueRemindersEnabled}
          />
        </Field>
        <ToggleRow
          label={t("manualToggle")}
          checked={settings.manualEnabled}
          onChange={(v) => onSave({ manualEnabled: v })}
          disabled={saving}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
      <h2 className="text-sm font-semibold text-zinc-300 mb-4 uppercase tracking-wide">
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
      <span className="text-sm text-zinc-200">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-5 h-5 accent-emerald-500 cursor-pointer"
      />
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mt-3">
      <span className="text-xs text-zinc-400 block mb-1">{label}</span>
      {children}
    </label>
  );
}

function ChannelRow({
  name,
  connected,
  waiting,
  onConnect,
  onDisconnect,
  connecting,
  labels,
}: {
  name: string;
  connected: boolean;
  waiting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  connecting: boolean;
  labels: {
    connected: string;
    waiting: string;
    notConnected: string;
    connect: string;
    disconnect: string;
  };
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-0">
      <div>
        <div className="text-zinc-100 font-medium">{name}</div>
        <div className="text-xs text-zinc-500 mt-0.5">
          {connected
            ? labels.connected
            : waiting
              ? labels.waiting
              : labels.notConnected}
        </div>
      </div>
      <div>
        {connected ? (
          <button
            onClick={onDisconnect}
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            {labels.disconnect}
          </button>
        ) : (
          <button
            onClick={onConnect}
            disabled={connecting}
            className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5 disabled:opacity-60"
          >
            {connecting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : waiting ? (
              <CheckCircle2 size={12} />
            ) : (
              <Send size={12} />
            )}
            {labels.connect}
          </button>
        )}
      </div>
    </div>
  );
}
