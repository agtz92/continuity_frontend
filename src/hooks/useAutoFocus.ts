"use client";

import { useIsMobile } from "./useIsMobile";

/**
 * Returns true on desktop, false on mobile. Use as the value of an
 * autoFocus prop to avoid summoning the mobile keyboard on modal open.
 */
export function useAutoFocus(): boolean {
  return !useIsMobile();
}
