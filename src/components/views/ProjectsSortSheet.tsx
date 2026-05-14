"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { PROJECT_SORT_MODES, type ProjectSortMode } from "@/lib/priority";

export function ProjectsSortSheet({
  open,
  value,
  onChange,
  onClose,
}: {
  open: boolean;
  value: ProjectSortMode;
  onChange: (next: ProjectSortMode) => void;
  onClose: () => void;
}) {
  const t = useTranslations("views.projects");
  const tSheet = useTranslations("views.projects.sortSheet");

  if (!open) return null;

  return (
    <BottomSheet title={tSheet("title")} onClose={onClose} initialHeight="auto">
      <ul className="space-y-1 py-1">
        {PROJECT_SORT_MODES.map((mode) => {
          const active = value === mode;
          return (
            <li key={mode}>
              <button
                onClick={() => {
                  onChange(mode);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-base transition-colors ${
                  active ? "bg-border text-text" : "text-text hover:bg-border"
                }`}
              >
                <span className="flex-1 text-left">{t(`sortBy.${mode}`)}</span>
                {active && <Check size={18} className="text-accent" />}
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
