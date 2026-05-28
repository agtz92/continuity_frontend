"use client";

import {
  CheckCircle2,
  Folder,
  Lightbulb,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { BottomSheet } from "@/components/ui/BottomSheet";

type Action = {
  id: "newTask" | "newProject" | "newIdea" | "newRoutine";
  icon: LucideIcon;
  tint: string;
};

const ACTIONS: Action[] = [
  { id: "newTask", icon: CheckCircle2, tint: "text-accent" },
  { id: "newProject", icon: Folder, tint: "text-accent-2" },
  { id: "newRoutine", icon: Repeat, tint: "text-accent-2" },
  { id: "newIdea", icon: Lightbulb, tint: "text-purple-400" },
];

export function TodayActionSheet({
  open,
  onClose,
  onNewTask,
  onNewProject,
  onNewIdea,
  onNewRoutine,
}: {
  open: boolean;
  onClose: () => void;
  onNewTask: () => void;
  onNewProject: () => void;
  onNewIdea: () => void;
  onNewRoutine: () => void;
}) {
  const t = useTranslations("views.today.fab");

  if (!open) return null;

  const handlers: Record<Action["id"], () => void> = {
    newTask: onNewTask,
    newProject: onNewProject,
    newIdea: onNewIdea,
    newRoutine: onNewRoutine,
  };

  return (
    <BottomSheet title={t("open")} onClose={onClose} initialHeight="auto">
      <ul className="space-y-1 py-1">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.id}>
              <button
                onClick={() => {
                  handlers[action.id]();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-base text-text hover:bg-border transition-colors"
              >
                <Icon size={20} className={action.tint} />
                <span className="flex-1 text-left">{t(action.id)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
