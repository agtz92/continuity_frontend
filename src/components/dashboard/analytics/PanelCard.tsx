"use client";

import type { ReactNode } from "react";

export function PanelCard({
  title,
  subtitle,
  icon,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-surface border border-border rounded-xl p-4 sm:p-5 ${className}`}
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <div>
          <h3 className="text-sm font-semibold text-text flex items-center gap-2">
            {icon}
            {title}
          </h3>
          {subtitle ? (
            <div className="text-xs text-text-muted mt-0.5">{subtitle}</div>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}
