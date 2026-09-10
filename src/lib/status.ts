import {
  Activity,
  AlertCircle,
  XCircle,
  Archive,
  Lightbulb,
  Pause,
  Rocket,
  Skull,
  Zap,
} from "lucide-react";
import type { ProjectStatus } from "@/lib/types";

/**
 * Iconos y tonos por estado. Las etiquetas NO están aquí porque dependen del
 * idioma — se resuelven con `useTranslations("status")(status)`.
 *
 * El rediseño saca de aquí los colores fijos de Tailwind (esmeralda/ámbar/
 * azul/púrpura con variante `dark:`) y los pasa a la escala del sistema. La
 * regla: **el color no es la señal**. `--closed` marca lo cerrado a propósito,
 * `--accent` lo que está vivo, y todo lo demás se dice con el peso de la regla
 * y con la espina de la fila (`<Spine>`), que sí distingue los siete estados
 * sin depender del color.
 *
 * `stalled` es "14 días sin actividad", detectado por cron — el *enfriamiento*
 * del diseño, no el *atoro*. Por eso no lleva tinta de alarma: el dato que
 * importa es el contador de días sin tocar, no el badge.
 */
export const statusConfig: Record<
  ProjectStatus | "blocked",
  { color: string; icon: React.ComponentType<{ size?: number }> }
> = {
  // "Atorado" no es un ProjectStatus: se deriva de tener tareas bloqueadas
  // (DP-03). Vive aquí porque el índice lo ofrece como filtro junto a los
  // estados reales. Es el único que conserva tinta de alarma.
  blocked: {
    color: "bg-signal-a12 text-signal border-signal-a50",
    icon: XCircle,
  },
  idea: {
    color: "bg-line-04 text-text-4 border-line-14",
    icon: Lightbulb,
  },
  active: {
    color: "bg-accent-a12 text-accent border-accent-a35",
    icon: Zap,
  },
  stalled: {
    color: "bg-line-06 text-text-3 border-line-22",
    icon: AlertCircle,
  },
  paused: {
    color: "bg-line-06 text-text-4 border-line-22",
    icon: Pause,
  },
  launched: {
    color: "bg-line-06 text-closed border-line-22",
    icon: Rocket,
  },
  killed: {
    color: "bg-line-04 text-text-5 border-line-14",
    icon: Skull,
  },
  archived: {
    color: "bg-line-04 text-text-5 border-line-14",
    icon: Archive,
  },
};

export const STATUS_FILTER_ORDER: Array<"all" | "blocked" | ProjectStatus> = [
  "all",
  "blocked",
  "active",
  "stalled",
  "idea",
  "paused",
  "launched",
  "killed",
  "archived",
];

export const fallbackStatusIcon = Activity;
