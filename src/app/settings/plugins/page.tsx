"use client";

import { Plug } from "lucide-react";
import { useTranslations } from "next-intl";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { ComingSoon } from "@/components/settings/ComingSoon";

export default function PluginsSettingsPage() {
  const t = useTranslations("settings.plugins");
  return (
    <SettingsShell title={t("title")} description={t("description")}>
      <ComingSoon icon={Plug} message={t("comingSoonBody")} />
    </SettingsShell>
  );
}
