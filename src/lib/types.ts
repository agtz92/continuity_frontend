export type ProjectStatus =
  | "idea"
  | "active"
  | "stalled"
  | "paused"
  | "launched"
  | "archived";

export type Priority = "critical" | "high" | "medium" | "low";

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
}

export interface Task {
  id: string;
  title: string;
  projectId: string | null;
  dueDate: string | null;
  done: boolean;
  completedAt: string | null;
  created: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  why: string;
  created: string;
}

export interface UpdateEntry {
  id: string;
  projectId: string;
  note: string;
  date: string;
}

export interface DashboardData {
  projects: Project[];
  tasks: Task[];
  ideas: Idea[];
  updates: UpdateEntry[];
  categories: Category[];
  lastBackup: string | null;
}

export const PRIORITIES: { value: Priority; emoji: string; label: string }[] = [
  { value: "critical", emoji: "🔥", label: "Critical" },
  { value: "high", emoji: "⚡", label: "High" },
  { value: "medium", emoji: "🌱", label: "Medium" },
  { value: "low", emoji: "🧊", label: "Low" },
];

export const priorityMeta = (p: Priority) =>
  PRIORITIES.find((x) => x.value === p) ?? PRIORITIES[2];

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

// Static map — Tailwind needs the literal class names in source to keep them.
const CATEGORY_COLOR_MAP: Record<string, { chip: string; dot: string }> = {
  emerald: { chip: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  blue: { chip: "bg-blue-500/15 text-blue-300 border-blue-500/30", dot: "bg-blue-400" },
  purple: { chip: "bg-purple-500/15 text-purple-300 border-purple-500/30", dot: "bg-purple-400" },
  amber: { chip: "bg-amber-500/15 text-amber-300 border-amber-500/30", dot: "bg-amber-400" },
  rose: { chip: "bg-rose-500/15 text-rose-300 border-rose-500/30", dot: "bg-rose-400" },
  cyan: { chip: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30", dot: "bg-cyan-400" },
  indigo: { chip: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30", dot: "bg-indigo-400" },
  pink: { chip: "bg-pink-500/15 text-pink-300 border-pink-500/30", dot: "bg-pink-400" },
  lime: { chip: "bg-lime-500/15 text-lime-300 border-lime-500/30", dot: "bg-lime-400" },
  orange: { chip: "bg-orange-500/15 text-orange-300 border-orange-500/30", dot: "bg-orange-400" },
};

export const categoryColorClass = (color: string) =>
  CATEGORY_COLOR_MAP[color] ?? CATEGORY_COLOR_MAP.emerald;
