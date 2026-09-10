export type ProjectStatus =
  | "idea"
  | "active"
  | "stalled"
  | "paused"
  | "launched"
  | "killed"
  | "archived";

export type Priority = "critical" | "high" | "medium" | "low";

/** Tramo de enfriamiento. Los cortes viven en el backend, no aquí. */
export type Cooling = "warm" | "cool" | "cold";

export interface Category {
  id: string;
  name: string;
  color: string;
  created: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  why: string;
  nextStep: string;
  status: ProjectStatus;
  priority: Priority;
  categoryId: string | null;
  lastActivity: string;
  created: string;
  dueDate: string | null;
  // Closure notes (state-closure system). Optional so older cached/imported
  // shapes stay valid; text fields default to "" from the backend.
  pausedContext?: string;
  pausedNextAction?: string;
  pausedBlocker?: string;
  pausedAt?: string | null;
  killedReason?: string;
  killedLearnings?: string;
  killedWouldRestart?: string;
  killedAt?: string | null;
  killedAiReflection?: string;
  stalledAt?: string | null;
  /** Manual order ("Mi orden" sort). Dense 0..N once reordered; 0 by default. */
  position?: number;
  /** Días desde el último movimiento. Derivado en el servidor para que web y
   *  móvil no discrepen en los tramos (backend: core/services/cooling.py). */
  daysSinceTouch?: number;
  /** Tramo de enfriamiento: 0-7 warm · 8-21 cool · 22+ cold. */
  cooling?: Cooling;
  /** Blocker abierto más antiguo entre sus tareas pendientes. */
  blockedSince?: string | null;
  /** "Atorado": tiene al menos una tarea abierta con blocker. NO es un estado
   *  del modelo, se deriva (REDISENO_PLAN.md §8, DP-03). */
  isBlocked?: boolean;
}

export interface GraveyardInsight {
  /** AI-written pattern across the user's killed projects (empty until >=3 deaths). */
  body: string;
  deathsCount: number;
  computedAt: string | null;
  isStale: boolean;
}

export interface ProjectNote {
  id: string;
  projectId: string;
  title: string;
  body: string;
  created: string;
  updatedAt: string;
}

export interface TaskBlocker {
  id: string;
  blockedTaskId: string;
  blockingTaskId: string | null;
  externalDescription: string;
  created: string;
}

export interface Task {
  id: string;
  title: string;
  projectId: string | null;
  dueDate: string | null;
  done: boolean;
  completedAt: string | null;
  created: string;
  effortHours: number | null;
  dueTime: string | null; // "HH:MM:SS" or null = all-day
  durationMinutes: number | null;
  // State-closure parking: the due-date snapshot kept while the parent project
  // is closed. Non-null means "this task had a due date" → the revive UI offers
  // to restore it. null on live tasks.
  parkedDueDate: string | null;
  parkedDueTime: string | null;
  blockers: TaskBlocker[];
  /** Derivados de `blockers` en el servidor: desde cuándo y por qué. */
  blockedSince?: string | null;
  blockedReason?: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  why: string;
  created: string;
}

export interface NoteSection {
  id: string;
  noteId: string;
  heading: string;
  body: string;
  position: number;
  collapsed: boolean;
  created: string;
  updatedAt: string;
}

export interface QuickNote {
  id: string;
  title: string;
  categoryId: string | null;
  projectId: string | null;
  pinned: boolean;
  sections: NoteSection[];
  created: string;
  updatedAt: string;
}

export type ActivityKind =
  | "note"
  | "project_created"
  | "project_deleted"
  | "project_status_changed"
  | "project_due_date_changed"
  | "task_created"
  | "task_completed"
  | "task_deleted"
  | "task_due_date_changed"
  | "idea_created"
  | "idea_deleted"
  | "idea_promoted"
  | "routine_created"
  | "routine_completed"
  | "routine_deleted"
  | "quick_note_created"
  | "quick_note_deleted";

export type RecurrenceType = "once" | "weekly_days" | "every_n" | "monthly_day";

export type IntervalUnit = "days" | "weeks" | "months";

export interface Routine {
  id: string;
  title: string;
  description: string;
  recurrenceType: RecurrenceType;
  startDate: string; // ISO date "YYYY-MM-DD"
  endDate: string | null;
  weekdays: number[]; // 0=mon..6=sun
  intervalN: number | null;
  intervalUnit: IntervalUnit | null;
  monthlyDay: number | null;
  effortHours: number | null;
  archived: boolean;
  created: string;
  projectId: string | null;
  timeOfDay: string | null; // "HH:MM:SS" or null = all-day
  durationMinutes: number | null;
}

export interface RoutineOccurrence {
  id: string;
  routineId: string;
  scheduledDate: string;
  completedAt: string;
  note: string;
  created: string;
}

export interface RoutineDueItem {
  routineId: string;
  scheduledDate: string;
  occurrenceId: string | null;
}

export interface Activity {
  id: string;
  kind: ActivityKind;
  entityId: string | null;
  entityTitle: string;
  projectId: string | null;
  targetProjectId: string | null;
  note: string;
  previousValue: string;
  newValue: string;
  created: string;
}

export interface DashboardData {
  projects: Project[];
  tasks: Task[];
  ideas: Idea[];
  activities: Activity[];
  categories: Category[];
  projectNotes: ProjectNote[];
  routines: Routine[];
  routineOccurrences: RoutineOccurrence[];
  lastBackup: string | null;
}

export type AnalyticsRange =
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "LAST_90_DAYS"
  | "LAST_365_DAYS"
  | "ALL_TIME";

export interface CadenceStats {
  activeDaysInRange: number;
  totalActivityEvents: number;
}

export interface ActivityPoint {
  day: string;
  updates: number;
  completedTasks: number;
  totalEvents: number;
}

export interface WeekdayBucket {
  weekday: number; // ISO 1=Mon..7=Sun
  count: number;
}

export interface ProjectInteractionRow {
  projectId: string;
  name: string;
  status: ProjectStatus;
  interactions: number;
  deltaVsPrev: number;
}

export interface StatusCount {
  status: ProjectStatus;
  count: number;
}

export interface CategoryRow {
  categoryId: string | null;
  name: string;
  color: string;
  projectCount: number;
  interactions: number;
}

export interface BacklogHealth {
  overdueTasks: number;
  dueSoonTasks: number;
  openTasks: number;
  quickWins: number;
  almostThere: number;
}

export interface SleepingProjectRow {
  projectId: string;
  name: string;
  daysIdle: number;
  bucket: "7-14" | "15-30" | "30+";
}

export interface StaleIdeaRow {
  ideaId: string;
  title: string;
  daysOld: number;
}

export interface IdeaFunnel {
  ideasCreated: number;
  ideasPromoted: number;
  promotionRate: number;
}

export interface EffortProjectRow {
  projectId: string;
  name: string;
  hours: number;
}

export interface EffortStats {
  effortHoursTotal: number;
  tasksWithEffortPct: number;
  effortHoursByProject: EffortProjectRow[];
}

export interface LoopToolRow {
  tool: string;
  count: number;
}

export interface LoopDailyPoint {
  day: string;
  messages: number;
  deepMessages: number;
}

export interface LoopStats {
  messagesSent: number;
  messagesDeltaVsPrev: number;
  conversations: number;
  actionsTaken: number;
  activeDays: number;
  deepMessages: number;
  connectorInteractions: number;
  daily: LoopDailyPoint[];
  topTools: LoopToolRow[];
}

export interface AnalyticsData {
  range: AnalyticsRange;
  rangeStart: string | null;
  rangeEnd: string;
  cadence: CadenceStats;
  activitySeries: ActivityPoint[];
  weekdayHeatmap: WeekdayBucket[];
  topProjects: ProjectInteractionRow[];
  statusCounts: StatusCount[];
  categoryBreakdown: CategoryRow[];
  backlog: BacklogHealth;
  sleepingProjects: SleepingProjectRow[];
  staleIdeas: StaleIdeaRow[];
  ideaFunnel: IdeaFunnel;
  effort: EffortStats;
  loop: LoopStats;
}

/**
 * Priority values in severity order. Localized labels live in messages
 * under `priority.{value}` and should be resolved via `useTranslations`.
 */
export const PRIORITIES: Priority[] = ["critical", "high", "medium", "low"];

export const priorityRank = (p: Priority): number => {
  const order: Record<Priority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return order[p] ?? 2;
};

export const CATEGORY_COLORS = [
  "emerald",
  "blue",
  "purple",
  "amber",
  "rose",
  "cyan",
  "indigo",
  "pink",
  "lime",
  "orange",
] as const;

/**
 * Color de categoría. El rediseño lo saca de la pastilla y lo mete en una
 * **muesca de 3px**: el chip queda neutro y solo el punto conserva el color.
 * Con diez categorías, pintar el fondo y el texto de cada una convertía
 * cualquier lista en un semáforo y no jerarquizaba nada.
 *
 * De paso desaparece la variante `dark:`: el chip neutro se resuelve con la
 * escala de reglas, que ya es sensible al tema, y el punto usa un tono 400 que
 * funciona sobre fondo claro y oscuro.
 *
 * Mapa estático: Tailwind necesita los nombres de clase literales en el fuente.
 */
const CATEGORY_CHIP = "bg-line-06 text-text-3 border-line-14";

const CATEGORY_COLOR_MAP: Record<string, { chip: string; dot: string }> = {
  emerald: { chip: CATEGORY_CHIP, dot: "bg-accent" },
  blue: { chip: CATEGORY_CHIP, dot: "bg-sky-400" },
  purple: { chip: CATEGORY_CHIP, dot: "bg-purple-400" },
  amber: { chip: CATEGORY_CHIP, dot: "bg-amber-400" },
  rose: { chip: CATEGORY_CHIP, dot: "bg-rose-400" },
  cyan: { chip: CATEGORY_CHIP, dot: "bg-cyan-400" },
  indigo: { chip: CATEGORY_CHIP, dot: "bg-indigo-400" },
  pink: { chip: CATEGORY_CHIP, dot: "bg-pink-400" },
  lime: { chip: CATEGORY_CHIP, dot: "bg-lime-400" },
  orange: { chip: CATEGORY_CHIP, dot: "bg-orange-400" },
};

export const categoryColorClass = (color: string) =>
  CATEGORY_COLOR_MAP[color] ?? CATEGORY_COLOR_MAP.emerald;
