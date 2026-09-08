/**
 * The landing's conversion target, which depends on whether the beta is open.
 *
 * Five sections have a primary CTA and every one of them has to agree, so the
 * branch lives here instead of being retyped in each. The switch behind it is
 * `beta_enrollment_open` in /admin/beta — see `fetchBetaProgram`.
 */

export type BetaProgram = {
  enrollmentOpen: boolean;
  spotsLeft: number;
};

/** Closed is the safe default: it undersells rather than promising a spot. */
export const BETA_CLOSED: BetaProgram = {
  enrollmentOpen: false,
  spotsLeft: 0,
};

/**
 * Where the primary CTAs point.
 *
 * While the beta runs that's the beta section; once it closes that section is
 * gone, so they fall back to pricing — the conversion target of a product you
 * actually pay for. Anything still linking to `#beta` would land nowhere.
 */
export function ctaHref(beta: BetaProgram): string {
  return beta.enrollmentOpen ? "#beta" : "#pricing";
}

/**
 * Picks between the neutral copy and its `…Beta` twin.
 *
 * The base key is the neutral one on purpose: when the beta is over — the
 * permanent state — the landing reads as a normal product, and the beta copy
 * is what needs the suffix to be reached.
 */
export function betaKey(beta: BetaProgram, key: string): string {
  return beta.enrollmentOpen ? `${key}Beta` : key;
}
