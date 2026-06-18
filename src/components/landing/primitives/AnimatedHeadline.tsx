import { createElement } from "react";
import type { ElementType } from "react";

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  /**
   * `scroll` (default) reveals on scroll-into-view; `load` runs the entrance
   * once on first paint — use it for above-the-fold headlines that must show
   * immediately. Both are pure CSS (see `.ls-reveal` / `.ls-fade-up` in
   * globals.css) so no framer-motion is pulled into the marketing bundle.
   */
  reveal?: "scroll" | "load";
};

/**
 * Headline that fades + lifts into view. Was a word-by-word framer-motion
 * reveal; now a single CSS entrance — cheaper to paint on mobile Safari and it
 * keeps the text in the static HTML (no hydration gate, no blur animation).
 */
export default function AnimatedHeadline({
  text,
  as = "h2",
  className = "",
  reveal = "scroll",
}: Props) {
  const revealClass = reveal === "load" ? "ls-fade-up" : "ls-reveal";
  return createElement(as, { className: `${revealClass} ${className}` }, text);
}
