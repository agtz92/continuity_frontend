"use client";

import { useTranslations } from "next-intl";

import type { GroupDiagnosis } from "./projectSort";
import { Meta } from "@/components/ui/Meta";

/**
 * Cabecera de grupo en el índice agrupado por categoría (S02b).
 *
 * **La línea de diagnóstico es el punto de la sección**, no un adorno: el
 * canvas lo dice literalmente — *"sin eso, agrupar solo reordena"*. Saber que
 * Clientes tiene tres proyectos, uno atorado y siete días de media sin tocar
 * cambia por dónde empiezas; verlos ordenados por categoría, no.
 *
 * El conteo de atorados es el único que se enciende. Lo demás es tinta apagada:
 * un grupo frío no es una alarma.
 */
export function ProjectGroupHeader({
  label,
  diagnosis,
}: {
  label: string;
  diagnosis: GroupDiagnosis;
}) {
  const t = useTranslations("views.projects.group");

  return (
    <div className="bg-surface px-5 pt-3 pb-1.5">
      <Meta variant="cintillo" tone="muted" className="block">
        {label}
      </Meta>
      <span className="flex items-center gap-2 flex-wrap mt-0.5">
        <Meta tone="faint">{t("projects", { count: diagnosis.total })}</Meta>
        {diagnosis.blocked > 0 && (
          <>
            <Meta tone="faint" aria-hidden="true">
              ·
            </Meta>
            <Meta variant="cintillo" tone="inherit" className="text-signal">
              ✕ {t("blocked", { count: diagnosis.blocked })}
            </Meta>
          </>
        )}
        <Meta tone="faint" aria-hidden="true">
          ·
        </Meta>
        <Meta tone="faint">{t("avgDays", { count: diagnosis.avgDays })}</Meta>
      </span>
    </div>
  );
}
