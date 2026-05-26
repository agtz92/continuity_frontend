"use client";

import { useRef } from "react";
import {
  CheckCircle2,
  Folder,
  MoreHorizontal,
  Repeat,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { DashboardView } from "./TabBar";

type PrimaryTab = {
  id: Extract<DashboardView, "today" | "projects" | "tasks" | "routines">;
  icon: LucideIcon;
};

const PRIMARY_TABS: PrimaryTab[] = [
  { id: "today", icon: Sun },
  { id: "projects", icon: Folder },
  { id: "tasks", icon: CheckCircle2 },
  { id: "routines", icon: Repeat },
];

/** Views that live inside the "Más" sheet. When one is active, the More tab lights up. */
const SECONDARY_VIEWS: ReadonlyArray<DashboardView> = ["ideas", "log", "analytics"];

const DOUBLE_TAP_MS = 300;

export function BottomTabBar({
  view,
  onChange,
  onOpenMore,
}: {
  view: DashboardView;
  onChange: (v: DashboardView) => void;
  onOpenMore: () => void;
}) {
  const t = useTranslations("tabs");
  const lastTapRef = useRef<{ id: string; at: number } | null>(null);

  const moreActive = SECONDARY_VIEWS.includes(view);

  const handleTabPress = (id: DashboardView) => {
    const now = performance.now();
    const last = lastTapRef.current;
    if (last && last.id === id && now - last.at < DOUBLE_TAP_MS && view === id) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      lastTapRef.current = null;
      return;
    }
    lastTapRef.current = { id, at: now };
    onChange(id);
  };

  return (
    <nav
      role="tablist"
      aria-label={t("more")}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around h-16">
        {PRIMARY_TABS.map((tab) => {
          const active = view === tab.id;
          const Icon = tab.icon;
          return (
            <li key={tab.id} className="flex-1">
              <button
                role="tab"
                aria-selected={active}
                onClick={() => handleTabPress(tab.id)}
                data-tour={tab.id === "projects" || tab.id === "tasks" || tab.id === "routines" ? tab.id : undefined}
                className={`relative w-full h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                  active ? "text-accent" : "text-text-muted"
                }`}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-accent"
                  />
                )}
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                <span>{t(tab.id)}</span>
              </button>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            aria-label={t("more")}
            aria-expanded={moreActive}
            onClick={onOpenMore}
            className={`relative w-full h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
              moreActive ? "text-accent" : "text-text-muted"
            }`}
          >
            {moreActive && (
              <span
                aria-hidden
                className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-accent"
              />
            )}
            <MoreHorizontal size={20} strokeWidth={moreActive ? 2.2 : 1.8} />
            <span>{t("more")}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
