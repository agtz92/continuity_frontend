import { cookies } from "next/headers";
import { DEFAULT_THEME, THEME_COOKIE, isTheme, type Theme } from "./config";

/**
 * Resolve the user's preferred theme from the cookie set by `setTheme`.
 * Falls back to DEFAULT_THEME ("system") for unauthenticated/first-visit users.
 *
 * Note: when this returns "system", the client-side no-flash script in
 * <head> swaps `data-theme` to the OS-effective value before paint.
 */
export async function resolveTheme(): Promise<Theme> {
  const store = await cookies();
  const raw = store.get(THEME_COOKIE)?.value;
  return isTheme(raw) ? raw : DEFAULT_THEME;
}
