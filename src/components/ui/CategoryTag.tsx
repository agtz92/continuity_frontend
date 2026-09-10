import { useTranslations } from "next-intl";

import { categoryColorClass } from "@/lib/types";
import { Meta } from "./Meta";

/**
 * Chip de categoría con **muesca izquierda**, nunca pastilla con borde: el
 * color vive en la muesca de 3px y el texto se queda neutro, para que veinte
 * chips en una lista no la conviertan en un semáforo.
 *
 * El código de dos letras (CL, PR, CO) hace de ancla visual: en el índice denso
 * la columna de categoría se lee sin leer la palabra.
 */

/** "cliente" → "CL". Dos letras, caja alta, sin acentos. */
export function categoryCode(name: string): string {
  const clean = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim();
  if (!clean) return "··";
  const words = clean.split(/\s+/);
  // Dos palabras → inicial de cada una ("Loop Society" → LS).
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

export function CategoryTag({
  name,
  color,
  code,
  /** Sin categoría: el diseño lo marca "·· suelta", no lo esconde. */
  loose = false,
  className = "",
}: {
  name?: string;
  color?: string;
  code?: string;
  loose?: boolean;
  className?: string;
}) {
  const t = useTranslations("category");
  if (loose || !name) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span aria-hidden="true" className="w-[3px] h-3 bg-line-14" />
        <Meta variant="cintillo" tone="faint">
          ·· {t("none")}
        </Meta>
      </span>
    );
  }

  // `categoryColorClass` devuelve clases de chip completas; aquí solo se usa el
  // punto, que es el único trozo que sigue siendo color de categoría.
  const dot = categoryColorClass(color ?? "emerald").dot;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span aria-hidden="true" className={`w-[3px] h-3 ${dot}`} />
      <Meta variant="cintillo" tone="muted">
        {code ?? categoryCode(name)}
      </Meta>
      <Meta tone="faint" className="lowercase tracking-normal font-medium">
        {name}
      </Meta>
    </span>
  );
}
