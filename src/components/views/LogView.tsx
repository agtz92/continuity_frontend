"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Edit2,
  FileText,
  RefreshCw,
  Rocket,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Activity, ActivityKind, Project } from "@/lib/types";
import { toLocalISO, todayLocalISODate, weekStartISO } from "@/lib/date";

type Filter = "all" | "achievements" | "notes" | "changes" | "deleted";

const FILTERS: Filter[] = ["all", "achievements", "notes", "changes", "deleted"];

const ACHIEVEMENT_KINDS: ActivityKind[] = [
  "task_completed",
  "project_created",
  "idea_promoted",
  "routine_completed",
];
const CHANGE_KINDS: ActivityKind[] = [
  "project_status_changed",
  "project_due_date_changed",
  "task_due_date_changed",
];
const DELETED_KINDS: ActivityKind[] = [
  "project_deleted",
  "task_deleted",
  "idea_deleted",
  "routine_deleted",
];

function matchesFilter(kind: ActivityKind, f: Filter): boolean {
  if (f === "all") return true;
  if (f === "notes") return kind === "note";
  if (f === "achievements") return ACHIEVEMENT_KINDS.includes(kind);
  if (f === "changes") return CHANGE_KINDS.includes(kind);
  if (f === "deleted") return DELETED_KINDS.includes(kind);
  return true;
}

function iconFor(kind: ActivityKind) {
  switch (kind) {
    case "note":
      return <FileText size={14} className="text-accent" />;
    case "task_completed":
    case "routine_completed":
      return <CheckCircle2 size={14} className="text-emerald-400" />;
    case "project_created":
    case "idea_created":
    case "task_created":
    case "routine_created":
      return <Sparkles size={14} className="text-amber-400" />;
    case "idea_promoted":
      return <Rocket size={14} className="text-purple-400" />;
    case "project_status_changed":
      return <RefreshCw size={14} className="text-cyan-400" />;
    case "project_due_date_changed":
    case "task_due_date_changed":
      return <Calendar size={14} className="text-blue-400" />;
    case "project_deleted":
    case "task_deleted":
    case "idea_deleted":
    case "routine_deleted":
      return <Trash2 size={14} className="text-red-400/70" />;
    default:
      return <FileText size={14} className="text-text-muted" />;
  }
}

function formatDate(iso: string | null, locale: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type DescribeArgs = {
  activity: Activity;
  locale: string;
  tEntry: (key: string, params?: Record<string, string>) => string;
  tStatus: (key: string) => string;
};

/** Renders an activity into a human-readable, localized line. */
function describe({ activity: a, locale, tEntry, tStatus }: DescribeArgs): string {
  const title = a.entityTitle || tEntry("untitled");
  switch (a.kind) {
    case "note":
      return a.note;
    case "task_completed":
      return tEntry("taskCompleted", { title });
    case "task_created":
      return tEntry("taskCreated", { title });
    case "task_deleted":
      return tEntry("taskDeleted", { title });
    case "task_due_date_changed":
      return a.newValue
        ? tEntry("taskRescheduled", {
            title,
            date: formatDate(a.newValue, locale),
          })
        : tEntry("taskDueCleared", { title });
    case "project_created":
      return tEntry("projectCreated", { title });
    case "project_deleted":
      return tEntry("projectDeleted", { title });
    case "project_status_changed":
      return tEntry("projectStatusChanged", {
        title,
        previous: a.previousValue ? tStatus(a.previousValue) : "",
        next: a.newValue ? tStatus(a.newValue) : "",
      });
    case "project_due_date_changed":
      return a.newValue
        ? tEntry("projectDueSet", {
            title,
            date: formatDate(a.newValue, locale),
          })
        : tEntry("projectDueCleared", { title });
    case "idea_created":
      return tEntry("ideaCreated", { title });
    case "idea_deleted":
      return tEntry("ideaDeleted", { title });
    case "idea_promoted":
      return tEntry("ideaPromoted", { title });
    case "routine_created":
      return tEntry("routineCreated", { title });
    case "routine_completed":
      return tEntry("routineCompleted", { title });
    case "routine_deleted":
      return tEntry("routineDeleted", { title });
    default:
      return a.entityTitle;
  }
}

type BucketKey = "today" | "yesterday" | "thisWeek" | "thisMonth" | "older";

const BUCKET_ORDER: BucketKey[] = [
  "today",
  "yesterday",
  "thisWeek",
  "thisMonth",
  "older",
];

export function LogView({
  activities,
  projects,
  onEditNote,
  onDeleteNote,
}: {
  activities: Activity[];
  projects: Project[];
  onEditNote: (a: Activity) => void;
  onDeleteNote: (id: string) => void | Promise<void>;
}) {
  const t = useTranslations("views.log");
  const tBuckets = useTranslations("views.log.buckets");
  const tFilters = useTranslations("views.log.filters");
  const tEntry = useTranslations("views.log.entries");
  const tStatus = useTranslations("status");
  const locale = useLocale();
  const [logSearch, setLogSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const bucketBoundaries = useMemo(() => {
    const today = todayLocalISODate();
    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    const yesterday = toLocalISO(yDate);
    const weekStart = weekStartISO();
    const monthDate = new Date();
    monthDate.setDate(1);
    const monthStart = toLocalISO(monthDate);
    return { today, yesterday, weekStart, monthStart };
  }, []);

  const bucketFor = (iso: string): BucketKey => {
    const date = iso.slice(0, 10);
    if (date === bucketBoundaries.today) return "today";
    if (date === bucketBoundaries.yesterday) return "yesterday";
    if (date >= bucketBoundaries.weekStart) return "thisWeek";
    if (date >= bucketBoundaries.monthStart) return "thisMonth";
    return "older";
  };

  const q = logSearch.trim().toLowerCase();
  const visible = activities
    .filter((a) => {
      if (!matchesFilter(a.kind, filter)) return false;
      if (!q) return true;
      const proj = projects.find((p) => p.id === a.projectId);
      const haystack = [
        a.note,
        a.entityTitle,
        proj?.name ?? "",
        a.previousValue,
        a.newValue,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    })
    .sort(
      (a, b) =>
        new Date(b.created).getTime() - new Date(a.created).getTime()
    );

  const grouped = useMemo(() => {
    const buckets: Record<BucketKey, Activity[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: [],
    };
    for (const a of visible) {
      buckets[bucketFor(a.created)].push(a);
    }
    return buckets;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, bucketBoundaries]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <div className="relative flex-1 sm:max-w-md sm:ml-auto">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            placeholder={t("search")}
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-text-muted"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                active
                  ? "bg-accent text-bg border-accent"
                  : "bg-surface border-border text-text-muted hover:text-text"
              }`}
            >
              {tFilters(f)}
            </button>
          );
        })}
      </div>

      {activities.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center text-text-muted">
          {t("empty")}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-muted text-sm">
          {q ? t("noMatch", { query: logSearch }) : t("noneInFilter")}
        </div>
      ) : (
        <div className="space-y-5">
          {BUCKET_ORDER.map((bucket) => {
            const entries = grouped[bucket];
            if (entries.length === 0) return null;
            return (
              <section key={bucket}>
                <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2 px-1">
                  {tBuckets(bucket)}
                  <span className="ml-1.5 text-text-muted/70 normal-case font-normal">
                    · {entries.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {entries.map((a) => {
                    const proj = projects.find((p) => p.id === a.projectId);
                    const isNote = a.kind === "note";
                    return (
                      <div
                        key={a.id}
                        className="bg-surface border border-border rounded-lg p-3 flex flex-col sm:flex-row gap-1 sm:gap-3 group"
                      >
                        <div className="flex items-start gap-2 shrink-0 sm:w-32">
                          <span className="mt-0.5">{iconFor(a.kind)}</span>
                          <div className="text-xs text-text-muted">
                            {formatDate(a.created, locale)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          {proj && (
                            <div className="text-xs text-accent mb-0.5">
                              {proj.name}
                            </div>
                          )}
                          <div className="text-sm text-text break-words">
                            {describe({ activity: a, locale, tEntry, tStatus })}
                          </div>
                        </div>
                        {isNote && (
                          <div className="flex items-start gap-2 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditNote(a)}
                              className="text-text-muted hover:text-accent"
                              aria-label={t("editEntryAria")}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(t("deleteConfirm"))) onDeleteNote(a.id);
                              }}
                              className="text-text-muted hover:text-red-400"
                              aria-label={t("deleteEntryAria")}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
