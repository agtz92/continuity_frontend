"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Clock,
  Hourglass,
  Plus,
  Search,
  Target,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { Category, Project, Routine, RoutineOccurrence } from "@/lib/types";
import { todayLocalISODate, toLocalISO } from "@/lib/date";
import {
  completedDatesFor,
  computeDueDates,
} from "@/lib/recurrence";
import {
  buildOccurrenceRule,
  currentStreak,
  type OccurrenceMark,
} from "@/lib/routineHistory";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { FAB } from "../ui/FAB";
import { RoutineRow } from "../routines/RoutineRow";
import { EmptyState, EmptyStateAction } from "../ui/EmptyState";

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

/**
 * Claves de la primera fila que cada rutina ocupa dentro de un bucket. Una
 * rutina diaria genera siete filas en "Próximas"; siete reglas de ocurrencias
 * idénticas serían ruido, así que solo la primera la lleva.
 */
function firstRowPerRoutine(items: DueItem[]): Set<string> {
  const seen = new Set<string>();
  const keys = new Set<string>();
  for (const it of items) {
    if (seen.has(it.routine.id)) continue;
    seen.add(it.routine.id);
    keys.add(`${it.routine.id}-${it.scheduledDate}`);
  }
  return keys;
}

export function RoutinesView({
  routines,
  occurrences,
  projects,
  categories,
  onNewRoutine,
  onEditRoutine,
  onArchiveRoutine,
  onDeleteRoutine,
  onCompleteOccurrence,
  onUncompleteOccurrence,
}: {
  routines: Routine[];
  occurrences: RoutineOccurrence[];
  projects: Project[];
  categories: Category[];
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
  const categoryById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  );
  const resolveRoutineProject = (r: Routine) => {
    if (!r.projectId) return undefined;
    const proj = projects.find((p) => p.id === r.projectId);
    if (!proj) return undefined;
    const cat = proj.categoryId ? categoryById[proj.categoryId] : undefined;
    return { name: proj.name, color: cat?.color ?? "emerald" };
  };
  const [search, setSearch] = useState("");
  const [showToday, setShowToday] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
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

  const {
    todayBucket,
    upcomingBucket,
    laterBucket,
    completedTodayBucket,
    archivedRoutines,
  } = useMemo(() => {
      const active = routines.filter((r) => !r.archived);
      const archived = routines.filter((r) => r.archived);
      const routineById = new Map(routines.map((r) => [r.id, r]));
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
      // Occurrences completed today — surfaced so an accidental completion
      // can be undone (toggling the checkbox calls onUncompleteOccurrence).
      const completedTodayItems: DueItem[] = [];
      for (const occ of occurrences) {
        if (toLocalISO(new Date(occ.completedAt)) !== today) continue;
        const r = routineById.get(occ.routineId);
        if (!r) continue;
        completedTodayItems.push({
          routine: r,
          scheduledDate: occ.scheduledDate,
          occurrenceId: occ.id,
        });
      }
      todayItems.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
      upcomingItems.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
      laterItems.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
      completedTodayItems.sort((a, b) =>
        a.scheduledDate.localeCompare(b.scheduledDate)
      );
      return {
        todayBucket: todayItems,
        upcomingBucket: upcomingItems,
        laterBucket: laterItems,
        completedTodayBucket: completedTodayItems,
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
  const filteredCompleted = filterByQuery(completedTodayBucket);
  const filteredUpcoming = filterByQuery(upcomingBucket);
  const filteredLater = filterByQuery(laterBucket);
  const filteredArchived = filterRoutinesByQuery(archivedRoutines);

  // Historia derivada por rutina (bloques + racha). Se calcula una sola vez:
  // la misma rutina puede aparecer en varios buckets.
  const history = useMemo(() => {
    const m = new Map<string, { rule: OccurrenceMark[]; streak: number }>();
    for (const r of routines) {
      const done = completedDatesFor(occurrences, r.id);
      m.set(r.id, {
        rule: buildOccurrenceRule(r, done, today),
        streak: currentStreak(r, done, today),
      });
    }
    return m;
  }, [routines, occurrences, today]);

  const firstToday = firstRowPerRoutine(filteredToday);
  const firstUpcoming = firstRowPerRoutine(filteredUpcoming);
  const firstLater = firstRowPerRoutine(filteredLater);

  const searching = q.length > 0;
  const todayOpen = searching || showToday;
  const completedOpen = searching || showCompleted;
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
        <EmptyState
          title={t("emptyTitle")}
          body={t("empty")}
          actions={
            <EmptyStateAction label={t("addFirst")} onClick={onNewRoutine} />
          }
        />
      ) : (
        <div className="space-y-3">
          <CollapsibleSection
            variant="card"
            open={todayOpen}
            onToggle={() => setShowToday((s) => !s)}
            icon={<Target size={14} className="text-accent" />}
            title={t("todayBucket")}
            rightSlot={
              <span className="text-xs text-accent bg-accent-a12 border border-accent-a35 rounded-full px-2 py-0.5">
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
                    rule={
                      firstToday.has(`${it.routine.id}-${it.scheduledDate}`)
                        ? history.get(it.routine.id)?.rule
                        : undefined
                    }
                    streak={history.get(it.routine.id)?.streak ?? 0}
                    scheduledDate={it.scheduledDate}
                    occurrenceId={it.occurrenceId}
                    project={resolveRoutineProject(it.routine)}
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

          {filteredCompleted.length > 0 && (
            <CollapsibleSection
              variant="card"
              open={completedOpen}
              onToggle={() => setShowCompleted((s) => !s)}
              icon={<CheckCircle2 size={14} className="text-accent" />}
              title={t("completedToday")}
              rightSlot={
                <span className="text-xs text-accent bg-accent-a12 border border-accent-a35 rounded-full px-2 py-0.5">
                  {filteredCompleted.length}
                </span>
              }
            >
              <div className="space-y-2">
                {filteredCompleted.map((it) => (
                  <RoutineRow
                    key={`${it.routine.id}-${it.scheduledDate}`}
                    routine={it.routine}
                    scheduledDate={it.scheduledDate}
                    occurrenceId={it.occurrenceId}
                    project={resolveRoutineProject(it.routine)}
                    onComplete={onCompleteOccurrence}
                    onUncomplete={onUncompleteOccurrence}
                    onEdit={onEditRoutine}
                  />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {filteredUpcoming.length > 0 && (
            <CollapsibleSection
              variant="card"
              open={upcomingOpen}
              onToggle={() => setShowUpcoming((s) => !s)}
              icon={<Clock size={14} className="text-text-3" />}
              title={t("upcoming")}
              rightSlot={
                <span className="text-xs text-text-3 bg-line-08 border border-line-14 rounded-full px-2 py-0.5">
                  {filteredUpcoming.length}
                </span>
              }
            >
              <div className="space-y-2">
                {filteredUpcoming.map((it) => (
                  <RoutineRow
                    key={`${it.routine.id}-${it.scheduledDate}`}
                    routine={it.routine}
                    rule={
                      firstUpcoming.has(`${it.routine.id}-${it.scheduledDate}`)
                        ? history.get(it.routine.id)?.rule
                        : undefined
                    }
                    streak={history.get(it.routine.id)?.streak ?? 0}
                    scheduledDate={it.scheduledDate}
                    occurrenceId={it.occurrenceId}
                    project={resolveRoutineProject(it.routine)}
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
                <span className="text-xs text-text-muted bg-line-08 border border-border rounded-full px-2 py-0.5">
                  {filteredLater.length}
                </span>
              }
            >
              <div className="space-y-2">
                {filteredLater.map((it) => (
                  <RoutineRow
                    key={`${it.routine.id}-${it.scheduledDate}`}
                    routine={it.routine}
                    rule={
                      firstLater.has(`${it.routine.id}-${it.scheduledDate}`)
                        ? history.get(it.routine.id)?.rule
                        : undefined
                    }
                    streak={history.get(it.routine.id)?.streak ?? 0}
                    scheduledDate={it.scheduledDate}
                    occurrenceId={it.occurrenceId}
                    project={resolveRoutineProject(it.routine)}
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
                <span className="text-xs text-text-muted bg-line-08 border border-border rounded-full px-2 py-0.5">
                  {filteredArchived.length}
                </span>
              }
            >
              <div className="space-y-2">
                {filteredArchived.map((r) => (
                  <RoutineRow
                    key={r.id}
                    routine={r}
                    rule={history.get(r.id)?.rule}
                    streak={history.get(r.id)?.streak ?? 0}
                    scheduledDate={r.startDate}
                    occurrenceId={null}
                    project={resolveRoutineProject(r)}
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
