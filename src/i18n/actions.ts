"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, isLocale } from "./config";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Server action: persist the user's locale choice in a cookie and revalidate.
 *
 * The DB-level persistence (NotificationSettings.locale) is handled separately
 * via the GraphQL mutation; this action is what makes the change take effect
 * for the next request. Always called alongside the mutation when the user
 * changes their language from the UI.
 */
export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
