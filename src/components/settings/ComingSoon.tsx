"use client";

import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  message,
}: {
  icon: LucideIcon;
  message: string;
}) {
  const tCommon = useTranslations("common");
  return (
    <div className="bg-surface/50 border border-border rounded-xl px-6 py-12 text-center">
      <Icon size={28} className="mx-auto mb-3 text-text-muted" />
      <p className="text-text-muted text-sm">{message}</p>
      <p className="text-text-muted text-xs mt-2">{tCommon("comingSoon")}</p>
    </div>
  );
}
