"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "../ui/Modal";
import { Field } from "../ui/Field";
import { TimeOfDayField } from "../ui/TimeOfDayField";
import { ChipGroup, type ChipOption } from "../ui/ChipGroup";
import { useAutoFocus } from "@/hooks/useAutoFocus";
import { weekdayShortLabels } from "@/lib/recurrence";
import { todayLocalISODate } from "@/lib/date";
import type { IntervalUnit, Project, RecurrenceType, Routine } from "@/lib/types";

type RoutineDraft = Partial<Routine> & { id?: string };

const RECURRENCE_TYPES: RecurrenceType[] = [
  "once",
  "weekly_days",
  "every_n",
  "monthly_day",
];

const EFFORT_PRESETS = [0.25, 0.5, 1, 2] as const;

export function RoutineModal({
  routine,
  projects,
  onSave,
  onClose,
}: {
  routine: RoutineDraft | null;
  projects: Project[];
  onSave: (r: {
    id?: string;
    title: string;
    description: string;
    recurrenceType: RecurrenceType;
    startDate: string;
    endDate: string | null;
    weekdays: number[];
    intervalN: number | null;
    intervalUnit: IntervalUnit | null;
    monthlyDay: number | null;
    effortHours: number | null;
    projectId: string | null;
    timeOfDay: string | null;
    durationMinutes: number | null;
  }) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations("modals.routine");
  const tCommon = useTranslations("common");
  const tWeekday = useTranslations("recurrence.weekday.short");
  const tTask = useTranslations("modals.task");
  const tTime = useTranslations("modals.timeOfDay");
  const autoFocus = useAutoFocus();

  const [title, setTitle] = useState(routine?.title ?? "");
  const [description, setDescription] = useState(routine?.description ?? "");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    (routine?.recurrenceType as RecurrenceType) ?? "once"
  );
  const [startDate, setStartDate] = useState(
    routine?.startDate ?? todayLocalISODate()
  );
  const [endDate, setEndDate] = useState(routine?.endDate ?? "");
  const [weekdays, setWeekdays] = useState<number[]>(routine?.weekdays ?? []);
  const [intervalN, setIntervalN] = useState(
    routine?.intervalN != null ? String(routine.intervalN) : "1"
  );
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>(
    routine?.intervalUnit ?? "days"
  );
  const [effortHours, setEffortHours] = useState(
    routine?.effortHours != null ? String(routine.effortHours) : ""
  );
  const [projectId, setProjectId] = useState(routine?.projectId ?? "");
  const [timeOfDay, setTimeOfDay] = useState((routine?.timeOfDay ?? "").slice(0, 5));
  const [durationMinutes, setDurationMinutes] = useState(
    routine?.durationMinutes ?? 30
  );
  const [error, setError] = useState<string | null>(null);

  const toggleWeekday = (d: number) => {
    setWeekdays((curr) =>
      curr.includes(d) ? curr.filter((x) => x !== d) : [...curr, d].sort()
    );
  };

  const setHourChip = (h: number) => {
    setEffortHours((current) => (current === String(h) ? "" : String(h)));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setError(t("errorTitle"));
      return;
    }
    if (!startDate) {
      setError(t("errorStartDate"));
      return;
    }
    if (recurrenceType === "weekly_days" && weekdays.length === 0) {
      setError(t("errorWeekdays"));
      return;
    }
    let n: number | null = null;
    if (recurrenceType === "every_n") {
      const parsed = parseInt(intervalN, 10);
      if (!Number.isFinite(parsed) || parsed < 1) {
        setError(t("errorIntervalN"));
        return;
      }
      n = parsed;
    }
    let mDay: number | null = null;
    if (recurrenceType === "monthly_day") {
      // Derived from startDate — the user already picks "the 15th" by
      // choosing a start date on the 15th. Avoids a redundant input.
      const [, , dayStr] = startDate.split("-");
      const parsed = parseInt(dayStr ?? "", 10);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 31) {
        setError(t("errorMonthlyDay"));
        return;
      }
      mDay = parsed;
    }
    setError(null);

    const parsedEffort = effortHours.trim() ? parseFloat(effortHours) : NaN;

    onSave({
      id: routine?.id,
      title: title.trim(),
      description: description.trim(),
      recurrenceType,
      startDate,
      endDate: recurrenceType === "once" ? null : endDate || null,
      weekdays: recurrenceType === "weekly_days" ? weekdays : [],
      intervalN: recurrenceType === "every_n" ? n : null,
      intervalUnit: recurrenceType === "every_n" ? intervalUnit : null,
      monthlyDay: recurrenceType === "monthly_day" ? mDay : null,
      effortHours: Number.isFinite(parsedEffort) ? parsedEffort : null,
      projectId: projectId || null,
      timeOfDay: timeOfDay || null,
      durationMinutes: timeOfDay ? durationMinutes : null,
    });
  };

  const weekdayLabels = weekdayShortLabels(tWeekday);
  const currentEffort = effortHours.trim();
  const canSubmit = title.trim().length > 0;

  const recurrenceOptions: ChipOption<RecurrenceType>[] = RECURRENCE_TYPES.map(
    (type) => ({
      value: type,
      label:
        type === "once"
          ? t("type.once")
          : type === "weekly_days"
          ? t("type.weeklyDays")
          : type === "every_n"
          ? t("type.everyN")
          : t("type.monthlyDay"),
    })
  );

  return (
    <Modal
      title={routine?.id ? t("editTitle") : t("newTitle")}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 px-4 py-2 bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-bg rounded-lg font-medium text-sm"
          >
            {tCommon("save")}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-border hover:opacity-80 rounded-lg text-sm"
          >
            {tCommon("cancel")}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <Field label={t("titleField")}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
            autoFocus={autoFocus}
            enterKeyHint="next"
          />
        </Field>

        <Field label={t("description")}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm resize-none"
            placeholder={t("descriptionPlaceholder")}
          />
        </Field>

        {projects.length > 0 && (
          <Field label={tTask("project")}>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">{tTask("noProject")}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label={t("recurrenceType")}>
          <ChipGroup
            value={recurrenceType}
            options={recurrenceOptions}
            onChange={setRecurrenceType}
            ariaLabel={t("recurrenceType")}
          />
        </Field>

        <Field
          label={
            recurrenceType === "once" ? t("dateField") : t("startDateField")
          }
        >
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
          />
        </Field>

        <Field label={tTime("label")}>
          <TimeOfDayField
            time={timeOfDay}
            minutes={durationMinutes}
            onChangeTime={setTimeOfDay}
            onChangeMinutes={setDurationMinutes}
          />
        </Field>

        {recurrenceType === "weekly_days" && (
          <Field label={t("weekdaysField")}>
            <div className="flex gap-1.5 flex-wrap">
              {weekdayLabels.map((label, idx) => {
                const active = weekdays.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleWeekday(idx)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${
                      active
                        ? "bg-accent text-bg border-accent"
                        : "bg-border text-text-muted border-border hover:opacity-80"
                    }`}
                    aria-pressed={active}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        {recurrenceType === "every_n" && (
          <Field label={t("intervalField")}>
            <div className="flex items-stretch gap-2">
              <input
                type="number"
                min="1"
                value={intervalN}
                onChange={(e) => setIntervalN(e.target.value)}
                className="no-spinner flex-1 bg-border border border-border rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={intervalUnit}
                onChange={(e) =>
                  setIntervalUnit(e.target.value as IntervalUnit)
                }
                className="bg-border border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="days">{t("unit.days")}</option>
                <option value="weeks">{t("unit.weeks")}</option>
                <option value="months">{t("unit.months")}</option>
              </select>
            </div>
          </Field>
        )}

        {recurrenceType === "monthly_day" && (
          <div className="text-xs text-text-muted bg-border/40 border border-border rounded-lg px-3 py-2">
            {t("monthlyDayHint", {
              day: parseInt(startDate.split("-")[2] ?? "1", 10),
            })}
          </div>
        )}

        {recurrenceType !== "once" && (
          <Field label={t("endDateField")}>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
            />
          </Field>
        )}

        <Field label={t("effort")}>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {EFFORT_PRESETS.map((h) => {
                const active = currentEffort === String(h);
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHourChip(h)}
                    aria-pressed={active}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      active
                        ? "bg-accent text-bg border-accent"
                        : "bg-border text-text-muted border-border hover:opacity-80"
                    }`}
                  >
                    {h}h
                  </button>
                );
              })}
              {currentEffort && !EFFORT_PRESETS.some((h) => String(h) === currentEffort) && (
                <button
                  type="button"
                  onClick={() => setEffortHours("")}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border bg-border text-text-muted hover:opacity-80"
                >
                  {tTask("chips.clear")}
                </button>
              )}
            </div>
            <input
              type="number"
              step="0.5"
              min="0"
              value={effortHours}
              onChange={(e) => setEffortHours(e.target.value)}
              placeholder={t("effortPlaceholder")}
              className="no-spinner w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </Field>

        {error && (
          <div className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
