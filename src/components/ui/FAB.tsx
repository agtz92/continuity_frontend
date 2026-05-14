"use client";

import type { ReactNode } from "react";

/**
 * Floating Action Button — mobile-only by default.
 *
 * Positioned 80px from the viewport bottom so it clears the BottomTabBar
 * (h-16 + safe-area-inset-bottom) with breathing room. z-30 keeps it above
 * normal content but below BottomTabBar (z-40) and modal layers (z-50).
 */
export function FAB({
  icon,
  onClick,
  label,
  className = "",
}: {
  icon: ReactNode;
  onClick: () => void;
  /** Accessible label, required for icon-only buttons. */
  label: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`md:hidden fixed right-4 z-30 w-14 h-14 rounded-full bg-accent text-bg shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-transform ${className}`}
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 80px)" }}
    >
      {icon}
    </button>
  );
}
