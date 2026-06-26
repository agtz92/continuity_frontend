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

/** Smart layout sections (C): urgent first, at-risk next, everything else. */
export type SmartSection = "attention" | "risk" | "rest";
export const SMART_SECTION_ORDER: SmartSection[] = ["attention", "risk", "rest"];

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

export const matchesStatus = (p: Project, status: "all" | ProjectStatus) =>
  status === "all" || p.status === status;

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
  const b = urgencyBucket(p, tasks);
  if (b <= 1) return "attention";
  if (b === 2) return "risk";
  return "rest";
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
      const ba = urgencyBucket(a, tasks);
      const bb = urgencyBucket(b, tasks);
      if (ba !== bb) return ba - bb;
      const pd = priorityRank(a.priority) - priorityRank(b.priority);
      return pd !== 0 ? pd : byName(a, b);
    }
  }
};
