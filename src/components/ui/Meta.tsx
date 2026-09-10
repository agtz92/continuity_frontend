import type { ElementType, ReactNode } from "react";

/**
 * Metadato en versalitas. Sustituye al patrón `text-xs text-text-muted` que se
 * repetía por decenas y, en versalitas de 0.14em, hace de mono sin serlo — por
 * eso el sistema no tiene familia monoespaciada.
 *
 * - `cintillo`: etiqueta de sección. Caja alta, tracking amplio.
 * - `dato`: fecha, contador, identificador. Cifras tabulares, sin caja alta.
 *
 * Las clases `.meta` / `.meta-flat` viven en `globals.css` (@layer components).
 */
export function Meta({
  as: Tag = "span",
  variant = "dato",
  tone = "muted",
  title,
  className = "",
  children,
}: {
  as?: ElementType;
  variant?: "cintillo" | "dato";
  /** Tooltip para ratón cuando el metadato va abreviado ("3 D"). */
  title?: string;
  /** `muted` para apoyo, `faint` para lo verdaderamente secundario,
   *  `signal` para bloqueado/vencido, `closed` para completado. */
  tone?: "muted" | "faint" | "signal" | "closed" | "inherit";
  className?: string;
  children: ReactNode;
}) {
  const toneClass = {
    muted: "text-text-4",
    faint: "text-text-5",
    signal: "text-signal",
    closed: "text-closed",
    inherit: "",
  }[tone];

  return (
    <Tag
      title={title}
      className={`${variant === "cintillo" ? "meta" : "meta-flat"} ${toneClass} ${className}`}
    >
      {children}
    </Tag>
  );
}
