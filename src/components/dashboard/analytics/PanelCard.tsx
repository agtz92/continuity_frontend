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
      className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 ${className}`}
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            {icon}
            {title}
          </h3>
          {subtitle ? (
            <div className="text-xs text-zinc-500 mt-0.5">{subtitle}</div>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}
