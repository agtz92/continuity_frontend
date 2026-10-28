import type { ReactNode } from "react";
import { Analytics } from "@/app/analytics";
import { SignupTracker } from "./SignupTracker";

/**
 * Onboarding layout. No TopNav, no sidebar, no distractions. The flow is
 * supposed to feel like a separate surface from the dashboard so the user
 * doesn't accidentally navigate away mid-setup.
 *
 * The page underneath handles auth + redirect-if-already-done.
 *
 * GA (only with consent, no banner here) loads so `SignupTracker` can report
 * Google sign-ups; the rest of the app stays without GA.
 */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      {children}
      <Analytics />
      <SignupTracker />
    </div>
  );
}
