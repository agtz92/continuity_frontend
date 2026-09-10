/**
 * Lógica pura de filtrado y orden de proyectos para `ProjectsView`.
 *
 * Extraído del componente (ver AUDITORIA_CODIGO.md) para sacar la lógica de
 * negocio de la UI y poder testearla sola. Todas las funciones son puras:
 * reciben por parámetro lo que antes capturaban del closure del componente
 * (`tasks`, `locale`, `horizonISO`, `q`, `categoryById`).
 */

import type { Category, Priority, Project, ProjectStatus, Task } from "@/lib/types";
import { priorityRank } from "@/lib/types";
import {
  daysSince,
  dueDateOnly,
  isDueToday,
  isOverdue,
  todayLocalISODate,
} from "@/lib/date";
import { STATUS_FILTER_ORDER } from "@/lib/status";
import type { ProjectSortMode } from "@/lib/priority";
import type { DueFilter } from "./ProjectsFilterSheet";

/**
 * Las bandas del **triaje** (artboard 3a).
 *
 * El orden lo decide la urgencia, no el usuario. Antes eran tres bandas
 * genéricas (`attention` / `risk` / `rest`) cuyo criterio de cabecera era
 * "tiene tareas vencidas". Ahora la primera es **lo detenido**, y la distinción
 * importa: bloqueado es "espera algo que no depende de ti"; vencido es "se te
 * pasó". Son dos problemas con dos salidas distintas y el producto ya los
 * distingue en todas partes — mezclarlos aquí sería el único sitio donde no.
 *
 *   blocked   → tiene al menos una tarea abierta con blocker
 *   active    → vivo y con movimiento o con fecha encima (aquí caen las vencidas)
 *   cooling   → vivo pero lleva 8+ días sin tocarse
 *   sleeping  → en pausa. Colapsada al pie: sigue ahí, no grita
 *   launched  → lanzado. Colapsada al pie
 */
export type SmartSection =
  | "blocked"
  | "active"
  | "cooling"
  | "sleeping"
  | "launched";

/** Clave de grupo en el modo "categoría". Los sueltos comparten una. */
export const LOOSE_GROUP = "__loose";
export const categoryGroupOf = (p: Project): string =>
  p.categoryId ?? LOOSE_GROUP;

/**
 * La línea de diagnóstico de cada grupo: "3 proyectos · 1 atorado · 7 d de
 * media sin tocar". Es lo que convierte el agrupado en información — sin ella,
 * agrupar solo reordena.
 */
export interface GroupDiagnosis {
  total: number;
  blocked: number;
  avgDays: number;
}

export const diagnoseGroup = (
  group: Project[],
  tasks: Task[]
): GroupDiagnosis => {
  const blocked = group.filter(
    (p) =>
      p.isBlocked ??
      tasks.some(
        (t) => t.projectId === p.id && !t.done && (t.blockers?.length ?? 0) > 0
      )
  ).length;
  const days = group.map(
    (p) => p.daysSinceTouch ?? daysSince(p.lastActivity) ?? 0
  );
  const avgDays = days.length
    ? Math.round(days.reduce((s, d) => s + d, 0) / days.length)
    : 0;
  return { total: group.length, blocked, avgDays };
};
export const SMART_SECTION_ORDER: SmartSection[] = [
  "blocked",
  "active",
  "cooling",
  "sleeping",
  "launched",
];

/** Bandas que nacen plegadas: están ahí, con su contador, sin ocupar pantalla. */
export const COLLAPSED_SECTIONS: ReadonlySet<SmartSection> = new Set([
  "sleeping",
  "launched",
]);

/** Vencimiento: "all" pasa todo; "none" solo sin fecha; "overdue" antes de hoy;
 *  el resto es la ventana [hoy, hoy+7] definida por `horizonISO`. */
export const matchesDue = (p: Project, due: DueFilter, horizonISO: string) => {
  if (due === "all") return true;
  if (due === "none") return !p.dueDate;
  if (!p.dueDate) return false;
  const dueIso = dueDateOnly(p.dueDate);
  const today = todayLocalISODate();
  if (due === "overdue") return dueIso < today;
  return dueIso >= today && dueIso <= horizonISO;
};

/** "Atorado" no es un `ProjectStatus`: se deriva de tener tareas bloqueadas
 *  (DP-03). Se expone como filtro sintético junto a los estados reales. */
export type StatusFilter = "all" | "blocked" | ProjectStatus;

export const matchesStatus = (p: Project, status: StatusFilter) => {
  if (status === "all") return true;
  if (status === "blocked") return p.isBlocked === true;
  return p.status === status;
};

export const matchesPriority = (p: Project, priority: "all" | Priority) =>
  priority === "all" || p.priority === priority;

export const matchesCategory = (p: Project, categoryId: string | null) =>
  categoryId === null || p.categoryId === categoryId;

/** Búsqueda de texto libre sobre los campos visibles del proyecto y el nombre
 *  de su categoría; sin término (`q` vacío) no filtra nada. `q` debe venir ya
 *  en minúsculas y trim. */
export const matchesSearch = (
  p: Project,
  q: string,
  categoryById: Record<string, Category>
) => {
  if (!q) return true;
  const cat = p.categoryId ? categoryById[p.categoryId]?.name ?? "" : "";
  return (
    p.name.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    p.nextStep.toLowerCase().includes(q) ||
    p.why.toLowerCase().includes(q) ||
    cat.toLowerCase().includes(q)
  );
};

/** Bucket de urgencia para los modos "smart" y la sección Smart: 0 vencidas,
 *  1 vence hoy, 2 inactivo >=7 días (active/idea), 3 resto. Cuanto menor, más
 *  arriba aparece. */
export const urgencyBucket = (p: Project, tasks: Task[]) => {
  const projectTasks = tasks.filter((tk) => tk.projectId === p.id);
  const hasOverdue = projectTasks.some((tk) => !tk.done && isOverdue(tk.dueDate));
  if (hasOverdue) return 0;
  const hasToday = projectTasks.some((tk) => !tk.done && isDueToday(tk.dueDate));
  if (hasToday) return 1;
  const idle = daysSince(p.lastActivity) ?? 0;
  if (["active", "idea"].includes(p.status) && idle >= 7) return 2;
  return 3;
};

/** (C) Smart splits into sections; other modes are a single flat list. */
export const smartSectionOf = (p: Project, tasks: Task[]): SmartSection => {
  // El estado del modelo manda sobre lo derivado: un proyecto en pausa no está
  // "enfriándose", está guardado a propósito.
  if (p.status === "paused") return "sleeping";
  if (p.status === "launched") return "launched";

  const own = tasks.filter((t) => t.projectId === p.id);
  const blocked =
    p.isBlocked ??
    own.some((t) => !t.done && (t.blockers?.length ?? 0) > 0);
  if (blocked) return "blocked";

  const urgent = own.some(
    (t) => !t.done && (isOverdue(t.dueDate) || isDueToday(t.dueDate))
  );
  if (urgent) return "active";

  const idle = p.daysSinceTouch ?? daysSince(p.lastActivity) ?? 0;
  return idle > 7 ? "cooling" : "active";
};

/**
 * Tamaño del nombre por banda. La jerarquía la hace el cuerpo tipográfico, no
 * el gris — pero en versión suave (20/17/15) y no la del artboard (26/22/20/18),
 * porque con nombres de 26px dejan de caber los catorce proyectos sin scroll
 * que el propio plan pide como criterio de aceptación.
 */
export const NAME_SIZE_CLASS: Record<SmartSection, string> = {
  blocked: "text-[20px] leading-tight text-text",
  active: "text-[17px] leading-snug text-text",
  cooling: "text-[15px] leading-snug text-text-2",
  sleeping: "text-[15px] leading-snug text-text-3",
  launched: "text-[15px] leading-snug text-text-3",
};

export interface ProjectSortContext {
  sortMode: ProjectSortMode;
  locale: string;
  tasks: Task[];
}

/**
 * Comparador único parametrizado por `sortMode`. Cada modo aporta su clave
 * primaria (position / prioridad / reciente / nombre / estado / urgencia) y
 * todos caen al desempate alfabético para que el orden sea determinista.
 *
 * (B) El alfabético es el desempate final ESTABLE en todos lados; `lastActivity`
 * solo es clave en "recent" (no se cuela como clave secundaria, que era lo que
 * lanzaba un proyecto recién editado al tope de su banda).
 */
export const compareProjects = (
  a: Project,
  b: Project,
  { sortMode, locale, tasks }: ProjectSortContext
) => {
  const byName = (x: Project, y: Project) => x.name.localeCompare(y.name, locale);
  switch (sortMode) {
    case "manual":
      return (a.position ?? 0) - (b.position ?? 0) || byName(a, b);
    case "priority": {
      const d = priorityRank(a.priority) - priorityRank(b.priority);
      return d !== 0 ? d : byName(a, b);
    }
    case "recent": {
      const r =
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      return r !== 0 ? r : byName(a, b);
    }
    case "cold": {
      // Frío primero: más días sin tocar arriba. `daysSinceTouch` lo deriva el
      // servidor; si no viene (forma cacheada vieja), se cae a lastActivity.
      const da = a.daysSinceTouch ?? -new Date(a.lastActivity).getTime();
      const db = b.daysSinceTouch ?? -new Date(b.lastActivity).getTime();
      return db - da || byName(a, b);
    }
    case "category": {
      // El orden dentro del grupo es alfabético; el agrupado real lo hace la
      // vista con `categoryGroupOf`. Aquí solo hace falta que los de la misma
      // categoría queden contiguos y de forma determinista.
      const ca = a.categoryId ?? "";
      const cb = b.categoryId ?? "";
      if (ca !== cb) {
        // Los sueltos van al final: son el resto, no un grupo más.
        if (!ca) return 1;
        if (!cb) return -1;
        return ca.localeCompare(cb);
      }
      return byName(a, b);
    }
    case "name":
      return byName(a, b);
    case "status": {
      const sa = STATUS_FILTER_ORDER.indexOf(a.status);
      const sb = STATUS_FILTER_ORDER.indexOf(b.status);
      if (sa !== sb) return sa - sb;
      const pd = priorityRank(a.priority) - priorityRank(b.priority);
      return pd !== 0 ? pd : byName(a, b);
    }
    case "smart":
    default: {
      // El orden del triaje es **el de las bandas**, y tiene que ser el mismo
      // criterio que decide la cabecera (`smartSectionOf`). Cuando no lo era
      // —ordenaba por `urgencyBucket` y agrupaba por banda— las secciones se
      // intercalaban y la misma cabecera salía tres veces.
      const sa = SMART_SECTION_ORDER.indexOf(smartSectionOf(a, tasks));
      const sb = SMART_SECTION_ORDER.indexOf(smartSectionOf(b, tasks));
      if (sa !== sb) return sa - sb;
      // Dentro de la banda sí manda la urgencia: lo vencido antes que lo de hoy.
      const ba = urgencyBucket(a, tasks);
      const bb = urgencyBucket(b, tasks);
      if (ba !== bb) return ba - bb;
      const pd = priorityRank(a.priority) - priorityRank(b.priority);
      return pd !== 0 ? pd : byName(a, b);
    }
  }
};
