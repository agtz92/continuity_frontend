/**
 * Datos y formato compartidos por la home de admin (page.tsx) y sus tarjetas
 * (AdminHomeCards.tsx): etiquetas/colores de plan, estado de proyecto y tipo de
 * actividad; helpers de fecha; y el estilo del tooltip de recharts. Extraído de
 * page.tsx (ver AUDITORIA_CODIGO.md).
 */

export const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  studio: "Studio",
  admin: "Admin",
};

export const PLAN_COLORS: Record<string, string> = {
  free: "#94a3b8",
  pro: "#34d399",
  studio: "#a78bfa",
  admin: "#f59e0b",
};

export const STATE_LABELS: Record<string, string> = {
  idea: "Idea",
  active: "Activo",
  stalled: "Estancado",
  paused: "Pausado",
  launched: "Lanzado",
  archived: "Archivado",
};

export const STATE_COLORS: Record<string, string> = {
  idea: "#64748b",
  active: "#34d399",
  stalled: "#f59e0b",
  paused: "#60a5fa",
  launched: "#a78bfa",
  archived: "#475569",
};

export const KIND_LABELS: Record<string, string> = {
  note: "Notas",
  project_created: "Proyectos creados",
  project_deleted: "Proyectos borrados",
  project_status_changed: "Cambios de estado",
  project_due_date_changed: "Fechas movidas",
  task_created: "Tareas creadas",
  task_completed: "Tareas cerradas",
  task_deleted: "Tareas borradas",
  task_due_date_changed: "Tareas reagendadas",
  idea_created: "Ideas",
  idea_deleted: "Ideas borradas",
  idea_promoted: "Ideas promovidas",
  routine_created: "Rutinas creadas",
  routine_completed: "Rutinas cumplidas",
  routine_deleted: "Rutinas borradas",
};

export const fmtShortDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

export const fmtAgo = (iso: string | null): string => {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString();
};

export const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--text)",
} as const;
