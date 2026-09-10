"use client";

import { useMemo, useState } from "react";
import { Edit2, Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Activity, ActivityKind, Project } from "@/lib/types";
import { Meta } from "@/components/ui/Meta";
import {
  describeActivity,
  formatActivityDate,
  iconFor,
} from "@/components/log/entry";
import { toLocalISO, todayLocalISODate, weekStartISO } from "@/lib/date";
import { EmptyState } from "@/components/ui/EmptyState";

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
  "quick_note_deleted",
];

function matchesFilter(kind: ActivityKind, f: Filter): boolean {
  if (f === "all") return true;
  if (f === "notes") return kind === "note";
  if (f === "achievements") return ACHIEVEMENT_KINDS.includes(kind);
  if (f === "changes") return CHANGE_KINDS.includes(kind);
  if (f === "deleted") return DELETED_KINDS.includes(kind);
  return true;
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
        <EmptyState title={t("emptyTitle")} body={t("empty")} />
      ) : visible.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-8 text-center text-text-muted text-sm">
          {q ? t("noMatch", { query: logSearch }) : t("noneInFilter")}
        </div>
      ) : (
        <div className="space-y-5">
          {BUCKET_ORDER.map((bucket) => {
            const entries = grouped[bucket];
            if (entries.length === 0) return null;
            return (
              <section key={bucket}>
                <Meta variant="cintillo" tone="muted" as="h3" className="block mb-2 px-1">
                  {tBuckets(bucket)} · {entries.length}
                </Meta>
                {/* Diario, no feed: lo que TÚ escribiste pesa (párrafo de
                    lectura); lo que hizo el sistema es una línea en
                    versalitas. Sin cards — reglas de 1px. */}
                <div className="divide-y divide-border border-y border-border">
                  {entries.map((a) => {
                    const proj = projects.find((p) => p.id === a.projectId);
                    const isNote = a.kind === "note";
                    const body = describeActivity({ activity: a, locale, tEntry, tStatus });

                    if (!isNote) {
                    return (
                      <div
                        key={a.id}
                          className="flex items-baseline gap-3 py-2 px-1"
                      >
                          <Meta tone="faint" className="shrink-0 w-16 tabular-nums">
                            {formatActivityDate(a.created, locale)}
                          </Meta>
                          <span className="shrink-0">{iconFor(a.kind)}</span>
                          <Meta variant="cintillo" tone="muted">
                            {body}
                          </Meta>
                          </div>
                    );
}

                    return (
                      <div key={a.id} className="flex gap-3 py-4 px-1 group">
                        <Meta tone="faint" className="shrink-0 w-16 tabular-nums pt-1">
                          {formatActivityDate(a.created, locale)}
                        </Meta>
                        <div className="flex-1 min-w-0">
                          <Meta variant="cintillo" tone="muted" className="block mb-1">
                            {t("writtenUpdate")}
                            {proj ? ` · ${proj.name}` : ""}
                          </Meta>
                          <p className="text-[15px] leading-[1.6] text-text-2 break-words max-w-[68ch]">
                            {body}
                          </p>
                          </div>
                        <div className="flex items-start gap-2 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 ease-out">
                          <button
                            onClick={() => onEditNote(a)}
                            className="text-text-4 hover:text-accent"
                            aria-label={t("editEntryAria")}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(t("deleteConfirm"))) onDeleteNote(a.id);
                            }}
                            className="text-text-4 hover:text-signal"
                            aria-label={t("deleteEntryAria")}
                          >
                            <X size={14} />
                          </button>
                        </div>
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
