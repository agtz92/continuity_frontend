"use client";

import {
  BarChart3,
  ChevronRight,
  Lightbulb,
  NotebookPen,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { DashboardView } from "./TabBar";

type MoreItem = {
  id: Extract<DashboardView, "ideas" | "notes" | "log" | "analytics">;
  icon: LucideIcon;
};

const ITEMS: MoreItem[] = [
  { id: "ideas", icon: Lightbulb },
  { id: "notes", icon: NotebookPen },
  { id: "log", icon: TrendingUp },
  { id: "analytics", icon: BarChart3 },
];

/**
 * Bottom sheet listing the dashboard views that don't fit in the BottomTabBar.
 *
 * Intentionally lean: settings, categories, backup and sign-out are already
 * reachable on mobile via the avatar/AccountMenu in TopNav. Duplicating them
 * here would mean two surfaces to keep in sync.
 */
export function MoreSheet({
  open,
  view,
  onSelect,
  onClose,
}: {
  open: boolean;
  view: DashboardView;
  onSelect: (v: DashboardView) => void;
  onClose: () => void;
}) {
  const t = useTranslations("tabs");

  if (!open) return null;

  const handleSelect = (v: DashboardView) => {
    onSelect(v);
    onClose();
  };

  return (
    <BottomSheet title={t("more")} onClose={onClose} initialHeight="auto">
      <ul className="space-y-1 py-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <li key={item.id}>
              <button
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-base transition-colors ${
                  active
                    ? "bg-border text-text"
                    : "text-text hover:bg-border"
                }`}
              >
                <Icon
                  size={20}
                  className={active ? "text-accent" : "text-text-muted"}
                />
                <span className="flex-1 text-left">{t(item.id)}</span>
                <ChevronRight size={18} className="text-text-muted" />
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
