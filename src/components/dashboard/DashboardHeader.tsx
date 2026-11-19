"use client";

import { CalendarDays } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export function DashboardHeader({
  activeCount,
  launchedCount,
  stalledCount,
  activeThisWeek,
  hasData,
}: {
  activeCount: number;
  launchedCount: number;
  stalledCount: number;
  activeThisWeek: number;
  hasData: boolean;
}) {
  const t = useTranslations("dashboard.header");
  const locale = useLocale();
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
          {/* Temporal: acceso al juego GSD: ContinuuCity (estilo neón ochentero). Pasa el locale de la cuenta. */}
          <a
            href={`https://gsd.continuu.it/?lang=${locale}&connect=1`}
            target="_blank"
            rel="noopener"
            title={t("gtdTooltip")}
            className="group relative px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg -skew-x-6 bg-gradient-to-r from-[#ff3d9a] via-[#ff6a5a] to-[#ff8a3d] border border-[#ffb3d9] shadow-[0_0_14px_rgba(255,61,154,0.6)] hover:shadow-[0_0_22px_rgba(255,61,154,0.9)] hover:-translate-y-0.5 transition-all"
          >
            <span className="block skew-x-6 font-black italic uppercase tracking-wider text-[11px] sm:text-sm text-white [text-shadow:0_0_6px_#fff,0_2px_0_#1a0b2e] whitespace-nowrap">
              <span className="text-[#1a0b2e] bg-[#ffe14f] px-1.5 py-0.5 rounded mr-1 not-italic [text-shadow:none]">{t("gtdTag")}</span>
              <span className="text-[#00e5ff] [text-shadow:0_0_6px_#00e5ff]">:</span> {t("gtdName")}
            </span>
          </a>
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
            <div className="text-text-3 font-bold text-base sm:text-lg">
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
