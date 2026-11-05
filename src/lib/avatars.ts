/**
 * Catálogo de avatares: los siete personajes de The Loop Society, solo en
 * estilo vector. Las imágenes son miniaturas de 256 px empaquetadas en
 * `public/avatars/vector/` (≈8 KB c/u): salen del mismo dominio y del caché
 * de Vercel, sin pasar por Supabase Storage.
 *
 * Hasta 2026-11 hubo cuatro estilos (`3d`, `anime`, `8bit`, `vector`). Los ids
 * viejos que sigan guardados (o que mande un build móvil antiguo) se traducen
 * al mismo personaje en vector con `normalizeAvatarId`. Espejo en
 * `continuity-mobile/src/lib/avatars.ts` y `backend/core/services/profiles.py`.
 */
export type Avatar = {
  id: string;
  slug: string;
  nameKey: string;
};

const STYLE = "vector";
const LEGACY_STYLES = ["3d", "anime", "8bit"];

const SLUGS = ["momo", "yuki", "tako", "kuma", "hoshi", "pip", "tetsu"] as const;

export const AVATAR_CATALOG: Avatar[] = SLUGS.map((slug) => ({
  id: `${STYLE}/${slug}`,
  slug,
  nameKey: slug,
}));

/** Traduce un id viejo (`3d/momo`) a su equivalente vigente (`vector/momo`). */
export function normalizeAvatarId(id: string | null | undefined): string | null {
  if (!id) return null;
  const [style, slug] = id.split("/");
  if (LEGACY_STYLES.includes(style)) return `${STYLE}/${slug}`;
  return id;
}

export function getAvatarUrl(id: string): string {
  return `/avatars/${normalizeAvatarId(id)}.webp`;
}

export function isValidAvatarId(id: string | null | undefined): id is string {
  const n = normalizeAvatarId(id);
  return !!n && AVATAR_CATALOG.some((a) => a.id === n);
}
