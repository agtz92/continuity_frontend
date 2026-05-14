"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Clock,
  Hourglass,
  Plus,
  Repeat,
  Search,
  Target,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { Routine, RoutineOccurrence } from "@/lib/types";
import { todayLocalISODate, toLocalISO } from "@/lib/date";
import {
  completedDatesFor,
  computeDueDates,
} from "@/lib/recurrence";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { FAB } from "../ui/FAB";
import { RoutineRow } from "../routines/RoutineRow";

const HORIZON_DAYS = 7; // how far ahead we materialize pending occurrences for "Upcoming"
const BACKLOG_DAYS = 14; // how far back we surface missed pending occurrences
// For "Later": next pending occurrence for routines whose next date falls
// beyond HORIZON_DAYS. One row per routine, collapsed by default.
const LATER_LOOKAHEAD = 365;

interface DueItem {
  routine: Routine;
  scheduledDate: string;
  occurrenceId: string | null;
}

export function RoutinesView({
  routines,
  occurrences,
  onNewRoutine,
  onEditRoutine,
  onArchiveRoutine,
  onDeleteRoutine,
  onCompleteOccurrence,
  onUncompleteOccurrence,
}: {
  routines: Routine[];
  occurrences: RoutineOccurrence[];
  onNewRoutine: () => void;
  onEditRoutine: (r: Routine) => void;
  onArchiveRoutine: (r: Routine) => void | Promise<void>;
  onDeleteRoutine: (id: string) => void | Promise<void>;
  onCompleteOccurrence: (
    routineId: string,
    scheduledDate: string
  ) => void | Promise<void>;
  onUncompleteOccurrence: (occurrenceId: string) => void | Promise<void>;
}) {
  const t = useTranslations("views.routines");
  const tCommon = useTranslations("common");
  const [search, setSearch] = useState("");
  const [showToday, setShowToday] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [showLater, setShowLater] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const today = todayLocalISODate();
  const horizonDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + HORIZON_DAYS);
    return toLocalISO(d);
  }, []);
  const backlogStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - BACKLOG_DAYS);
    return toLocalISO(d);
  }, []);

  const laterHorizonDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + LATER_LOOKAHEAD);
    return toLocalISO(d);
  }, []);
  const dayAfterHorizon = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + HORIZON_DAYS + 1);
    return toLocalISO(d);
  }, []);

  const { todayBucket, upcomingBucket, laterBucket, archivedRoutines } =
    useMemo(() => {
      const active = routines.filter((r) => !r.archived);
      const archived = routines.filter((r) => r.archived);
      const occByRoutine = new Map<string, Set<string>>();
      for (const r of active) {
        occByRoutine.set(r.id, completedDatesFor(occurrences, r.id));
      }
      const todayItems: DueItem[] = [];
      const upcomingItems: DueItem[] = [];
      const laterItems: DueItem[] = [];
      const seenInUpcoming = new Set<string>();
      // Primary pass: Today & Upcoming within HORIZON_DAYS.
      for (const r of active) {
        const done = occByRoutine.get(r.id) ?? new Set<string>();
        const dates = computeDueDates(r, backlogStart, horizonDate);
        for (const d of dates) {
          if (done.has(d)) continue;
          if (d <= today) {
            todayItems.push({ routine: r, scheduledDate: d, occurrenceId: null });
          } else {
            upcomingItems.push({
              routine: r,
              scheduledDate: d,
              occurrenceId: null,
            });
          }
          seenInUpcoming.add(r.id);
        }
      }
      // Later pass: one entry per routine — the *next* pending occurrence
      // beyond the upcoming horizon. Skip routines already visible above.
      for (const r of active) {
        if (seenInUpcoming.has(r.id)) continue;
        const done = occByRoutine.get(r.id) ?? new Set<string>();
        const futureDates = computeDueDates(
          r,
          dayAfterHorizon,
          laterHorizonDate
        );
        const next = futureDates.find((d) => !done.has(d));
        if (next) {
          laterItems.push({
            routine: r,
            scheduledDate: next,
            occurrenceId: null,
          });
        }
      }
      todayItems.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
      upcomingItems.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
      laterItems.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
      return {
        todayBucket: todayItems,
        upcomingBucket: upcomingItems,
        laterBucket: laterItems,
        archivedRoutines: archived,
      };
    }, [
      routines,
      occurrences,
      today,
      horizonDate,
      backlogStart,
      dayAfterHorizon,
      laterHorizonDate,
    ]);

  const q = search.trim().toLowerCase();
  const filterByQuery = <T extends { routine: Routine }>(items: T[]): T[] =>
    q
      ? items.filter((i) =>
          i.routine.title.toLowerCase().includes(q)
        )
      : items;
  const filterRoutinesByQuery = (rs: Routine[]): Routine[] =>
    q ? rs.filter((r) => r.title.toLowerCase().includes(q)) : rs;

  const filteredToday = filterByQuery(todayBucket);
  const filteredUpcoming = filterByQuery(upcomingBucket);
  const filteredLater = filterByQuery(laterBucket);
  const filteredArchived = filterRoutinesByQuery(archivedRoutines);

  const searching = q.length > 0;
  const todayOpen = searching || showToday;
  const upcomingOpen = searching || showUpcoming;
  const laterOpen = searching || showLater;
  const archivedOpen = searching || showArchived;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <div className="flex items-center gap-2 flex-1 sm:max-w-md sm:ml-auto">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search")}
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-text-muted"
            />
          </div>
          <button
            onClick={onNewRoutine}
            className="px-4 py-2 bg-accent hover:opacity-90 text-bg rounded-lg font-medium text-sm hidden md:flex items-center gap-2 shrink-0"
          >
            <Plus size={16} /> {tCommon("new")}
          </button>
        </div>
      </div>

      {routines.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-text-muted mb-4">{t("empty")}</p>
          <button
            onClick={onNewRoutine}
            className="px-4 py-2 bg-accent hover:opacity-90 text-bg rounded-lg font-medium text-sm"
          >
            {t("addFirst")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <CollapsibleSection
            variant="card"
            open={todayOpen}
            onToggle={() => setShowToday((s) => !s)}
            icon={<Target size={14} className="text-orange-400" />}
            title={t("todayBucket")}
            rightSlot={
              <span className="text-xs text-orange-700 dark:text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-full px-2 py-0.5">
                {filteredToday.length}
              </span>
            }
          >
            {filteredToday.length === 0 ? (
              <div className="text-center text-sm text-text-muted py-4">
                {t("todayEmpty")}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredToday.map((it) => (
                  <RoutineRow
                    key={`${it.routine.id}-${it.scheduledDate}`}
                    routine={it.routine}
                    scheduledDate={it.scheduledDate}
                    occurrenceId={it.occurrenceId}
                    onComplete={onCompleteOccurrence}
                    onUncomplete={onUncompleteOccurrence}
                    onEdit={onEditRoutine}
                    onArchive={onArchiveRoutine}
                    onDelete={onDeleteRoutine}
                  />
                ))}
              </div>
            )}
          </CollapsibleSection>

          {filteredUpcoming.length > 0 && (
            <CollapsibleSection
              variant="card"
              open={upcomingOpen}
              onToggle={() => setShowUpcoming((s) => !s)}
              icon={<Clock size={14} className="text-accent-2" />}
              title={t("upcoming")}
              rightSlot={
                <span className="text-xs text-accent-2 bg-accent-2/10 border border-accent-2/30 rounded-full px-2 py-0.5">
                  {filteredUpcoming.length}
                </span>
              }
            >
              <div className="space-y-2">
                {filteredUpcoming.map((it) => (
                  <RoutineRow
                    key={`${it.routine.id}-${it.scheduledDate}`}
                    routine={it.routine}
                    scheduledDate={it.scheduledDate}
                    occurrenceId={it.occurrenceId}
                    onComplete={onCompleteOccurrence}
                    onUncomplete={onUncompleteOccurrence}
                    onEdit={onEditRoutine}
                    onArchive={onArchiveRoutine}
                  />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {filteredLater.length > 0 && (
            <CollapsibleSection
              variant="card"
              open={laterOpen}
              onToggle={() => setShowLater((s) => !s)}
              icon={<Hourglass size={14} className="text-text-muted" />}
              title={t("later")}
              rightSlot={
                <span className="text-xs text-text-muted bg-border/50 border border-border rounded-full px-2 py-0.5">
                  {filteredLater.length}
                </span>
              }
            >
              <div className="space-y-2">
                {filteredLater.map((it) => (
                  <RoutineRow
                    key={`${it.routine.id}-${it.scheduledDate}`}
                    routine={it.routine}
                    scheduledDate={it.scheduledDate}
                    occurrenceId={it.occurrenceId}
                    onComplete={onCompleteOccurrence}
                    onUncomplete={onUncompleteOccurrence}
                    onEdit={onEditRoutine}
                    onArchive={onArchiveRoutine}
                  />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {filteredArchived.length > 0 && (
            <CollapsibleSection
              variant="card"
              open={archivedOpen}
              onToggle={() => setShowArchived((s) => !s)}
              icon={<Archive size={14} className="text-text-muted" />}
              title={t("archived")}
              rightSlot={
                <span className="text-xs text-text-muted bg-border/50 border border-border rounded-full px-2 py-0.5">
                  {filteredArchived.length}
                </span>
              }
            >
              <div className="space-y-2">
                {filteredArchived.map((r) => (
                  <RoutineRow
                    key={r.id}
                    routine={r}
                    scheduledDate={r.startDate}
                    occurrenceId={null}
                    onComplete={() => Promise.resolve()}
                    onUncomplete={() => Promise.resolve()}
                    onEdit={onEditRoutine}
                    onArchive={onArchiveRoutine}
                    onDelete={onDeleteRoutine}
                  />
                ))}
              </div>
            </CollapsibleSection>
          )}
        </div>
      )}

      <FAB
        icon={<Plus size={24} />}
        label={t("newAria")}
        onClick={onNewRoutine}
      />
    </div>
  );
}
