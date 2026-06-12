import LandingPage from "@/components/marketing/LandingPage";

/**
 * Public marketing surface. Unlike `/`, this route does NOT redirect signed-in
 * users to `/dashboard` — it's where the in-app "View landing page" link sends
 * users who explicitly want to see the public site. Bookmarkable and crawlable.
 */
export default function WelcomePage() {
  return <LandingPage locale="en" />;
}
