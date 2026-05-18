import Landing from "@/components/landing/Landing";

/**
 * Public marketing surface. Unlike `/`, this route does not redirect signed-in
 * users to `/dashboard` — it's the route the in-app "View landing page" link
 * sends users to when they explicitly want to see the public site. Bookmarkable
 * and crawlable by anyone.
 */
export default function WelcomePage() {
  return <Landing />;
}
