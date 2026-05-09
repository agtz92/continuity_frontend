"use client";

import { SettingsShell } from "@/components/settings/SettingsShell";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";

export default function NotificationsSettingsPage() {
  return (
    <SettingsShell
      title="Notifications"
      description="Get nudges on Telegram so a project doesn't quietly die."
    >
      <NotificationSettings />
    </SettingsShell>
  );
}
