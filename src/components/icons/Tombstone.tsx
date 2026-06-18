import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

/**
 * Headstone / tombstone icon. lucide-react has no grave icon, so this matches
 * the lucide API (size/color/strokeWidth/className) for drop-in use in icon
 * configs. Used for the Graveyard tab.
 */
export const Tombstone = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 22V11a5 5 0 0 1 10 0v11" />
      <path d="M5 22h14" />
      <path d="M12 9v5" />
      <path d="M9.5 11.5h5" />
    </svg>
  )
);

Tombstone.displayName = "Tombstone";
