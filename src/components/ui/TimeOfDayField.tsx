"use client";

import { useTranslations } from "next-intl";
import { Sun, Clock } from "lucide-react";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;

function timeOptions(): string[] {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + minutes;
  const hh = Math.floor((total % (24 * 60)) / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/**
 * Optional time-of-day picker shared by the task and routine modals.
 *
 * Default state is "all day" (time === ""), which keeps Continuity's no-time
 * philosophy and maps to an all-day calendar event. Switching to "with time"
 * reveals a start + duration, mirroring how Google/Apple Calendar offer it.
 */
export function TimeOfDayField({
  time,
  minutes,
  onChangeTime,
  onChangeMinutes,
}: {
  time: string;
  minutes: number;
  onChangeTime: (t: string) => void;
  onChangeMinutes: (m: number) => void;
}) {
  const t = useTranslations("modals.timeOfDay");
  const timed = time !== "";

  return (
    <div className="space-y-2">
      <div className="inline-flex bg-border/60 border border-border rounded-lg p-0.5">
        <button
          type="button"
          aria-pressed={!timed}
          onClick={() => onChangeTime("")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            !timed ? "bg-accent text-bg" : "text-text-muted hover:opacity-80"
          }`}
        >
          <Sun size={14} />
          {t("allDay")}
        </button>
        <button
          type="button"
          aria-pressed={timed}
          onClick={() => onChangeTime("09:00")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            timed ? "bg-accent text-bg" : "text-text-muted hover:opacity-80"
          }`}
        >
          <Clock size={14} />
          {t("withTime")}
        </button>
      </div>

      {!timed ? (
        <div className="text-xs text-text-muted">{t("allDayHint")}</div>
      ) : (
        <>
          <div className="flex gap-2">
            <label className="flex-1">
              <div className="text-xs text-text-muted mb-1">{t("start")}</div>
              <select
                value={time}
                onChange={(e) => onChangeTime(e.target.value)}
                className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
              >
                {timeOptions().map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex-1">
              <div className="text-xs text-text-muted mb-1">{t("duration")}</div>
              <select
                value={minutes}
                onChange={(e) => onChangeMinutes(parseInt(e.target.value, 10))}
                className="w-full bg-border border border-border rounded-lg px-3 py-2 text-sm"
              >
                {DURATION_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {t("minutes", { count: m })}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="text-xs text-accent">
            {t("timedHint", { start: time, end: addMinutes(time, minutes) })}
          </div>
        </>
      )}
    </div>
  );
}
