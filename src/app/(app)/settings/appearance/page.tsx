"use client";

import { useTranslations } from "next-intl";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { PaletteSelector } from "@/components/settings/PaletteSelector";

export default function AppearanceSettingsPage() {
  const t = useTranslations("settings.appearance");

  return (
    <SettingsShell title={t("title")} description={t("description")}>
      <section className="bg-surface/50 border border-border rounded-xl p-5 space-y-6">
        <LanguageSelector />
        <ThemeSelector />
        <PaletteSelector />
      </section>
    </SettingsShell>
  );
}
