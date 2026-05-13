"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "../ui/Modal";
import { Field } from "../ui/Field";
import { weekdayShortLabels } from "@/lib/recurrence";
import { todayLocalISODate } from "@/lib/date";
import type {
  IntervalUnit,
  RecurrenceType,
  Routine,
} from "@/lib/types";

type RoutineDraft = Partial<Routine> & { id?: string };

export function RoutineModal({
  routine,
  onSave,
  onClose,
}: {
  routine: RoutineDraft | null;
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
  }) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations("modals.routine");
  const tCommon = useTranslations("common");

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
  const [monthlyDay, setMonthlyDay] = useState(
    routine?.monthlyDay != null ? String(routine.monthlyDay) : "1"
  );
  const [error, setError] = useState<string | null>(null);

  const toggleWeekday = (d: number) => {
    setWeekdays((curr) =>
      curr.includes(d) ? curr.filter((x) => x !== d) : [...curr, d].sort()
    );
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
      const parsed = parseInt(monthlyDay, 10);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 31) {
        setError(t("errorMonthlyDay"));
        return;
      }
      mDay = parsed;
    }
    setError(null);

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
    });
  };

  const weekdayLabels = weekdayShortLabels("es");

  return (
    <Modal title={routine?.id ? t("editTitle") : t("newTitle")} onClose={onClose}>
      <div className="space-y-3">
        <Field label={t("titleField")}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
            autoFocus
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

        <Field label={t("recurrenceType")}>
          <select
            value={recurrenceType}
            onChange={(e) =>
              setRecurrenceType(e.target.value as RecurrenceType)
            }
            className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
          >
            <option value="once">{t("type.once")}</option>
            <option value="weekly_days">{t("type.weeklyDays")}</option>
            <option value="every_n">{t("type.everyN")}</option>
            <option value="monthly_day">{t("type.monthlyDay")}</option>
          </select>
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
          <Field label={t("monthlyDayField")}>
            <input
              type="number"
              min="1"
              max="31"
              value={monthlyDay}
              onChange={(e) => setMonthlyDay(e.target.value)}
              className="no-spinner w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
            />
          </Field>
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

        {error && (
          <div className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-accent hover:opacity-90 text-bg rounded-lg font-medium text-sm"
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
      </div>
    </Modal>
  );
}
