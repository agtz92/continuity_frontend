"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PALETTE_COOKIE, isPalette } from "./config";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function setPalette(palette: string): Promise<void> {
  if (!isPalette(palette)) return;
  const store = await cookies();
  store.set(PALETTE_COOKIE, palette, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
