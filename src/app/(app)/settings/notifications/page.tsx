"use client";

import { useTranslations } from "next-intl";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";

export default function NotificationsSettingsPage() {
  const t = useTranslations("settings.notifications");
  return (
    <SettingsShell title={t("title")} description={t("description")}>
      <NotificationSettings />
    </SettingsShell>
  );
}
