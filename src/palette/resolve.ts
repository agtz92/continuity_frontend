import { cookies } from "next/headers";
import { DEFAULT_PALETTE, PALETTE_COOKIE, normalizePalette, type Palette } from "./config";

export async function resolvePalette(): Promise<Palette> {
  const store = await cookies();
  const raw = store.get(PALETTE_COOKIE)?.value;
  return normalizePalette(raw) ?? DEFAULT_PALETTE;
}
