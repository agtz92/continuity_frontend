"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { THEME_COOKIE, isTheme } from "./config";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Server action: persist the user's theme choice in a cookie and revalidate.
 *
 * The DB-level persistence (NotificationSettings.theme) is handled separately
 * via the GraphQL mutation; this action is what makes the change take effect
 * for the next request. Always called alongside the mutation when the user
 * changes their theme from the UI.
 */
export async function setTheme(theme: string): Promise<void> {
  if (!isTheme(theme)) return;
  const store = await cookies();
  store.set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
