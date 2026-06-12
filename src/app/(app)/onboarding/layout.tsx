import type { ReactNode } from "react";

/**
 * Onboarding layout. No TopNav, no sidebar, no distractions. The flow is
 * supposed to feel like a separate surface from the dashboard so the user
 * doesn't accidentally navigate away mid-setup.
 *
 * The page underneath handles auth + redirect-if-already-done.
 */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">{children}</div>
  );
}
