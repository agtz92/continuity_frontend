"use client";

import { THEME_PREVIEW } from "@/design/themePreview.generated";

/**
 * Un tema en 56×36: fondo, una superficie encima, un filete y una línea de
 * tinta. Es lo mínimo que hace reconocible un tema de un vistazo.
 *
 * `system` no tiene colores propios —es la preferencia del sistema operativo—
 * así que se dibuja partido: el claro a la izquierda y el oscuro por defecto a
 * la derecha. El diseño querría que dejara de ser un tema y pasara a ser un
 * interruptor aparte; eso es cambiar el modelo en los tres clientes y en el
 * backend, así que de momento sigue siendo el cuarto valor.
 */
export function ThemeSwatch({ theme }: { theme: string }) {
  if (theme === "system") {
    const light = THEME_PREVIEW.light;
    const dark = THEME_PREVIEW.continuu;
    return (
      <span
        aria-hidden="true"
        className="flex w-14 h-9 rounded-sm overflow-hidden border border-line-14"
      >
        <span className="flex-1" style={{ backgroundColor: light.bg }} />
        <span className="flex-1" style={{ backgroundColor: dark.bg }} />
      </span>
    );
  }

  const p = THEME_PREVIEW[theme];
  if (!p) return null;
  return (
    <span
      aria-hidden="true"
      className="block w-14 h-9 rounded-sm overflow-hidden border border-line-14 p-1"
      style={{ backgroundColor: p.bg }}
    >
      <span
        className="block w-full h-full rounded-[2px] p-1"
        style={{ backgroundColor: p.surface, boxShadow: `inset 0 0 0 1px ${p.line}` }}
      >
        <span
          className="block h-[2px] w-3/4 rounded-full"
          style={{ backgroundColor: p.text, opacity: 0.7 }}
        />
      </span>
    </span>
  );
}
