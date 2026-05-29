"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ChipGroup, type ChipOption } from "@/components/ui/ChipGroup";
import type { Category, Priority, ProjectStatus } from "@/lib/types";
import { categoryColorClass } from "@/lib/types";
import { STATUS_FILTER_ORDER } from "@/lib/status";
import { PRIORITY_FILTER_ORDER } from "@/lib/priority";

export type DueFilter = "all" | "overdue" | "soon" | "none";

export type ProjectFilterDraft = {
  status: "all" | ProjectStatus;
  priority: "all" | Priority;
  categoryId: string | null;
  due: DueFilter;
};

export const EMPTY_FILTER: ProjectFilterDraft = {
  status: "all",
  priority: "all",
  categoryId: null,
  due: "all",
};

export function ProjectsFilterSheet({
  open,
  initial,
  categories,
  previewCount,
  onApply,
  onClose,
}: {
  open: boolean;
  initial: ProjectFilterDraft;
  categories: Category[];
  /** Live count of projects that would match the given draft, shown on Apply button. */
  previewCount: (draft: ProjectFilterDraft) => number;
  onApply: (draft: ProjectFilterDraft) => void;
  onClose: () => void;
}) {
  const t = useTranslations("views.projects");
  const tSheet = useTranslations("views.projects.filterSheet");
  const tStatus = useTranslations("status");
  const tPriority = useTranslations("priority");

  const [draft, setDraft] = useState<ProjectFilterDraft>(initial);

  // Sync the local draft whenever the sheet opens or the parent's initial changes.
  useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  if (!open) return null;

  const statusOptions: ChipOption<"all" | ProjectStatus>[] =
    STATUS_FILTER_ORDER.map((s) => ({
      value: s,
      label: s === "all" ? tStatus("all") : tStatus(s),
    }));

  const priorityOptions: ChipOption<"all" | Priority>[] =
    PRIORITY_FILTER_ORDER.map((p) => ({
      value: p,
      label: p === "all" ? t("allPriorities") : tPriority(p),
    }));

  const dueOptions: ChipOption<DueFilter>[] = [
    { value: "all", label: tSheet("dueAny") },
    { value: "overdue", label: tSheet("dueOverdue") },
    { value: "soon", label: tSheet("dueSoon") },
    { value: "none", label: tSheet("dueNone") },
  ];

  const count = previewCount(draft);

  return (
    <BottomSheet
      title={tSheet("title")}
      onClose={onClose}
      initialHeight="auto"
      footer={
        <button
          onClick={() => {
            onApply(draft);
            onClose();
          }}
          disabled={count === 0}
          className="w-full px-4 py-2.5 bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-bg rounded-lg font-medium text-sm"
        >
          {count === 0
            ? tSheet("applyEmpty")
            : tSheet("apply", { count })}
        </button>
      }
    >
      <div className="flex items-center justify-end -mt-1 mb-2">
        <button
          type="button"
          onClick={() => setDraft(EMPTY_FILTER)}
          className="text-xs text-accent hover:opacity-80 px-2 py-1"
        >
          {tSheet("clear")}
        </button>
      </div>

      <div className="space-y-4">
        <FilterSection label={t("filterLabel.status")}>
          <ChipGroup
            value={draft.status}
            options={statusOptions}
            onChange={(status) => setDraft((d) => ({ ...d, status }))}
            ariaLabel={t("filterStatusAria")}
          />
        </FilterSection>

        <FilterSection label={t("filterLabel.priority")}>
          <ChipGroup
            value={draft.priority}
            options={priorityOptions}
            onChange={(priority) => setDraft((d) => ({ ...d, priority }))}
            ariaLabel={t("filterPriorityAria")}
          />
        </FilterSection>

        {categories.length > 0 && (
          <FilterSection label={t("filterLabel.category")}>
            <div className="flex flex-wrap gap-1.5">
              <CategoryChip
                active={draft.categoryId === null}
                label={t("allCategories")}
                onClick={() => setDraft((d) => ({ ...d, categoryId: null }))}
              />
              {categories.map((c) => {
                const active = draft.categoryId === c.id;
                const cls = categoryColorClass(c.color);
                return (
                  <CategoryChip
                    key={c.id}
                    active={active}
                    label={c.name}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        categoryId: active ? null : c.id,
                      }))
                    }
                    dotClass={cls.dot}
                  />
                );
              })}
            </div>
          </FilterSection>
        )}

        <FilterSection label={tSheet("dueDate")}>
          <ChipGroup
            value={draft.due}
            options={dueOptions}
            onChange={(due) => setDraft((d) => ({ ...d, due }))}
            ariaLabel={tSheet("dueDate")}
          />
        </FilterSection>
      </div>
    </BottomSheet>
  );
}

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-text-muted mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}

function CategoryChip({
  active,
  label,
  onClick,
  dotClass,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  dotClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1.5 ${
        active
          ? "bg-accent text-bg border-accent"
          : "bg-border text-text-muted border-border hover:opacity-80"
      }`}
    >
      {dotClass && <span className={`w-2 h-2 rounded-full ${dotClass}`} />}
      <span>{label}</span>
    </button>
  );
}
