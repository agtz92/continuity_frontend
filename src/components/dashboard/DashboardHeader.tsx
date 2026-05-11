"use client";

import { CalendarDays, Flame } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export function DashboardHeader({
  activeCount,
  launchedCount,
  stalledCount,
  streakCurrent,
  streakBest,
  activeThisWeek,
  hasData,
}: {
  activeCount: number;
  launchedCount: number;
  stalledCount: number;
  streakCurrent: number;
  streakBest: number;
  activeThisWeek: number;
  hasData: boolean;
}) {
  const t = useTranslations("dashboard.header");
  const locale = useLocale();
  const streakActive = streakCurrent > 0;
  const tiedRecord = streakActive && streakBest > 0 && streakCurrent === streakBest;
  const formattedDate = new Date().toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-text-muted text-sm">{formattedDate}</p>
        <div className="flex gap-2 text-xs items-center flex-wrap">
          {hasData && (streakActive || streakBest > 0) && (
            <div
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border leading-tight flex items-center gap-2 ${
                streakActive
                  ? "bg-orange-500/10 border-orange-500/30"
                  : "bg-surface border-border"
              }`}
              title={
                streakActive
                  ? t("streakTooltipActive", {
                      current: streakCurrent,
                      best: streakBest,
                    })
                  : t("streakTooltipBest", { best: streakBest })
              }
            >
              <Flame
                size={14}
                className={streakActive ? "text-orange-400" : "text-text-muted"}
              />
              <div>
                <div
                  className={`text-[10px] sm:text-xs ${streakActive ? "text-orange-300/80" : "text-text-muted"}`}
                >
                  {streakActive
                    ? tiedRecord
                      ? t("streakRecord")
                      : t("streak")
                    : t("best")}
                </div>
                <div
                  className={`font-bold text-base sm:text-lg ${streakActive ? "text-orange-300" : "text-text-muted"}`}
                >
                  {streakActive ? streakCurrent : streakBest}d
                </div>
              </div>
            </div>
          )}
          {hasData && (
            <div
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-surface rounded-lg border border-border leading-tight flex items-center gap-2"
              title={t("weekTooltip", { count: activeThisWeek })}
            >
              <CalendarDays size={14} className="text-text-muted" />
              <div>
                <div className="text-text-muted text-[10px] sm:text-xs">{t("thisWeek")}</div>
                <div className="text-text font-bold text-base sm:text-lg">
                  {activeThisWeek}/7
                </div>
              </div>
            </div>
          )}
          <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-surface rounded-lg border border-border leading-tight">
            <div className="text-text-muted text-[10px] sm:text-xs">{t("active")}</div>
            <div className="text-accent font-bold text-base sm:text-lg">
              {activeCount}
            </div>
          </div>
          <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-surface rounded-lg border border-border leading-tight">
            <div className="text-text-muted text-[10px] sm:text-xs">{t("launched")}</div>
            <div className="text-accent-2 font-bold text-base sm:text-lg">
              {launchedCount}
            </div>
          </div>
          {stalledCount > 0 && (
            <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-amber-500/10 rounded-lg border border-amber-500/30 leading-tight">
              <div className="text-amber-500/80 text-[10px] sm:text-xs">{t("stalled")}</div>
              <div className="text-amber-400 font-bold text-base sm:text-lg">
                {stalledCount}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
