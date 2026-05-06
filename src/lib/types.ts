export type ProjectStatus =
  | "idea"
  | "active"
  | "stalled"
  | "paused"
  | "launched"
  | "archived";

export interface Project {
  id: string;
  name: string;
  description: string;
  why: string;
  nextStep: string;
  status: ProjectStatus;
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
  lastBackup: string | null;
}
