"use client";

import { Plug } from "lucide-react";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { ComingSoon } from "@/components/settings/ComingSoon";

export default function PluginsSettingsPage() {
  return (
    <SettingsShell
      title="Plugins"
      description="Connect Continuity with the tools you already use."
    >
      <ComingSoon
        icon={Plug}
        message="Integrations like GitHub, Linear, Notion, and Slack will live here."
      />
    </SettingsShell>
  );
}
