"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  Plus,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Rocket,
  Pause,
  Archive,
  X,
  Edit2,
  Trash2,
  ChevronRight,
  TrendingUp,
  Bell,
  Target,
  Zap,
  Activity,
  Download,
  Upload,
  Database,
  LogOut,
  Search,
  Sparkles,
  Clock,
  CalendarPlus,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import {
  ADD_UPDATE,
  CREATE_CATEGORY,
  CREATE_IDEA,
  CREATE_PROJECT,
  CREATE_TASK,
  DASHBOARD_QUERY,
  DELETE_CATEGORY,
  DELETE_IDEA,
  DELETE_PROJECT,
  DELETE_TASK,
  MARK_BACKUP,
  PROMOTE_IDEA,
  TOGGLE_TASK,
  UPDATE_PROJECT,
  UPDATE_TASK,
} from "@/lib/graphql";
import type {
  Category,
  DashboardData,
  Idea,
  Priority,
  Project,
  ProjectStatus,
  Task,
  UpdateEntry,
} from "@/lib/types";
import {
  categoryColorClass,
  priorityMeta,
  priorityRank,
} from "@/lib/types";
import {
  CategoryManagementModal,
  IdeaModal,
  ProjectModal,
  TaskModal,
  UpdateModal,
} from "./modals";
import { Modal } from "./ui";
import { Tags } from "lucide-react";

type View = "today" | "projects" | "tasks" | "ideas" | "log";

const statusConfig: Record<
  ProjectStatus,
  { label: string; color: string; icon: React.ComponentType<{ size?: number }> }
> = {
  idea: {
    label: "Idea",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    icon: Lightbulb,
  },
  active: {
    label: "Active",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: Zap,
  },
  stalled: {
    label: "Stalled",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: AlertCircle,
  },
  paused: {
    label: "Paused",
    color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    icon: Pause,
  },
  launched: {
    label: "Launched",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    icon: Rocket,
  },
  archived: {
    label: "Archived",
    color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    icon: Archive,
  },
};

const daysSince = (dateStr?: string | null) => {
  if (!dateStr) return null;
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
};

const todayLocalISODate = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};

const dueDateOnly = (dateStr: string) => dateStr.slice(0, 10);

const isDueToday = (dateStr?: string | null) => {
  if (!dateStr) return false;
  return dueDateOnly(dateStr) === todayLocalISODate();
};

const isOverdue = (dateStr?: string | null) => {
  if (!dateStr) return false;
  return dueDateOnly(dateStr) < todayLocalISODate();
};

const daysOverdue = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const due = new Date(dueDateOnly(dateStr) + "T00:00:00");
  const today = new Date(todayLocalISODate() + "T00:00:00");
  const diff = Math.floor(
    (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff > 0 ? diff : null;
};

const statusBorderClass: Record<ProjectStatus, string> = {
  active: "border-l-emerald-500/60",
  idea: "border-l-purple-500/60",
  stalled: "border-l-amber-500/60",
  paused: "border-l-slate-500/60",
  launched: "border-l-blue-500/60",
  archived: "border-l-zinc-600",
};

const STATUS_FILTER_ORDER: Array<"all" | ProjectStatus> = [
  "all",
  "active",
  "stalled",
  "idea",
  "paused",
  "launched",
  "archived",
];

const isCompletedToday = (dateStr?: string | null) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const localISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return localISO === todayLocalISODate();
};

export default function Dashboard() {
  const { data, loading, error, refetch } = useQuery<{ dashboard: DashboardData }>(
    DASHBOARD_QUERY,
    { fetchPolicy: "cache-and-network" }
  );

  const refetchAfter = { refetchQueries: [{ query: DASHBOARD_QUERY }] };
  const [createProject] = useMutation(CREATE_PROJECT, refetchAfter);
  const [updateProjectM] = useMutation(UPDATE_PROJECT, refetchAfter);
  const [deleteProjectM] = useMutation(DELETE_PROJECT, refetchAfter);
  const [createTask] = useMutation(CREATE_TASK, refetchAfter);
  const [updateTaskM] = useMutation(UPDATE_TASK, refetchAfter);
  const [toggleTaskM] = useMutation(TOGGLE_TASK, refetchAfter);
  const [deleteTaskM] = useMutation(DELETE_TASK, refetchAfter);
  const [createIdea] = useMutation(CREATE_IDEA, refetchAfter);
  const [deleteIdeaM] = useMutation(DELETE_IDEA, refetchAfter);
  const [promoteIdeaM] = useMutation(PROMOTE_IDEA, refetchAfter);
  const [addUpdateM] = useMutation(ADD_UPDATE, refetchAfter);
  const [createCategoryM] = useMutation(CREATE_CATEGORY, refetchAfter);
  const [deleteCategoryM] = useMutation(DELETE_CATEGORY, refetchAfter);
  const [markBackupM] = useMutation(MARK_BACKUP);

  const [view, setView] = useState<View>("today");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState<"all" | ProjectStatus>("active");
  const [projectCategoryFilter, setProjectCategoryFilter] = useState<string | null>(null);
  const [taskSearch, setTaskSearch] = useState("");
  const [showTodayFocus, setShowTodayFocus] = useState(true);
  const [showDoneToday, setShowDoneToday] = useState(true);
  const [showActiveProjects, setShowActiveProjects] = useState(true);
  const [showLaunchedWithTasks, setShowLaunchedWithTasks] = useState(true);
  const [doneTodayFilter, setDoneTodayFilter] = useState<"all" | "task" | "log">("all");
  const [showTodayTasks, setShowTodayTasks] = useState(true);
  const [showUnscheduledTasks, setShowUnscheduledTasks] = useState(false);
  const [showUpcomingTasks, setShowUpcomingTasks] = useState(false);
  const [showDoneTasks, setShowDoneTasks] = useState(false);
  const [ideaSearch, setIdeaSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const projects = data?.dashboard.projects ?? [];
  const tasks = data?.dashboard.tasks ?? [];
  const ideas = data?.dashboard.ideas ?? [];
  const categories = data?.dashboard.categories ?? [];
  const categoryById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  );
  const updates = useMemo<UpdateEntry[]>(() => {
    const list = data?.dashboard.updates ?? [];
    return [...list].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [data]);
  const lastBackup = data?.dashboard.lastBackup ?? null;

  const stalled = useMemo(
    () =>
      projects.filter(
        (p) =>
          ["active", "idea"].includes(p.status) &&
          (daysSince(p.lastActivity) ?? 0) >= 7
      ),
    [projects]
  );

  const todayFocus = useMemo(() => {
    const focus: Array<{
      type: "overdue" | "today" | "stalled" | "nextStep";
      task?: Task;
      project?: Project;
    }> = [];

    tasks
      .filter((t) => !t.done && isOverdue(t.dueDate))
      .forEach((t) =>
        focus.push({
          type: "overdue",
          task: t,
          project: projects.find((p) => p.id === t.projectId),
        })
      );

    tasks
      .filter((t) => !t.done && isDueToday(t.dueDate))
      .forEach((t) =>
        focus.push({
          type: "today",
          task: t,
          project: projects.find((p) => p.id === t.projectId),
        })
      );

    stalled.slice(0, 3).forEach((p) => focus.push({ type: "stalled", project: p }));

    projects
      .filter((p) => p.status === "active")
      .forEach((p) => {
        const projectTasks = tasks.filter(
          (t) => t.projectId === p.id && !t.done
        );
        if (projectTasks.length === 0 && p.nextStep) {
          focus.push({ type: "nextStep", project: p });
        }
      });

    return { items: focus.slice(0, 6), total: focus.length };
  }, [projects, tasks, stalled]);

  const todayTaskCounts = useMemo(() => {
    const overdue = tasks.filter((t) => !t.done && isOverdue(t.dueDate)).length;
    const dueToday = tasks.filter((t) => !t.done && isDueToday(t.dueDate)).length;
    return { overdue, dueToday, total: overdue + dueToday };
  }, [tasks]);

  const doneTodayItems = useMemo(() => {
    type DoneItem =
      | { kind: "task"; time: number; task: Task }
      | { kind: "log"; time: number; update: UpdateEntry };
    const items: DoneItem[] = [];
    tasks
      .filter((t) => t.done && isCompletedToday(t.completedAt))
      .forEach((t) =>
        items.push({
          kind: "task",
          time: t.completedAt ? new Date(t.completedAt).getTime() : 0,
          task: t,
        })
      );
    updates
      .filter((u) => isCompletedToday(u.date))
      .forEach((u) =>
        items.push({
          kind: "log",
          time: new Date(u.date).getTime(),
          update: u,
        })
      );
    return items.sort((a, b) => b.time - a.time);
  }, [tasks, updates]);

  const projectStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: projects.length,
      active: 0,
      idea: 0,
      stalled: 0,
      paused: 0,
      launched: 0,
      archived: 0,
    };
    const today = todayLocalISODate();
    for (const p of projects) {
      counts[p.status] = (counts[p.status] ?? 0) + 1;
      const lastDay = p.lastActivity ? p.lastActivity.slice(0, 10) : null;
      const idleDays = lastDay
        ? Math.floor(
            (new Date(today + "T00:00:00").getTime() -
              new Date(lastDay + "T00:00:00").getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;
      if (
        ["active", "idea"].includes(p.status) &&
        (idleDays ?? 0) >= 7
      ) {
        counts.stalled = (counts.stalled ?? 0) + 1;
      }
    }
    return counts;
  }, [projects]);

  const launchedWithOpenTasks = useMemo(
    () =>
      projects
        .filter((p) => p.status === "launched")
        .map((p) => {
          const projectTasks = tasks.filter((t) => t.projectId === p.id);
          const openCount = projectTasks.filter((t) => !t.done).length;
          return { project: p, projectTasks, openCount };
        })
        .filter((x) => x.openCount > 0),
    [projects, tasks]
  );

  const activeCount = projects.filter((p) => p.status === "active").length;
  const launchedCount = projects.filter((p) => p.status === "launched").length;
  const daysSinceBackup = lastBackup ? daysSince(lastBackup) : null;
  const backupOverdue =
    !lastBackup || (daysSinceBackup !== null && daysSinceBackup >= 7);
  const hasData = projects.length > 0 || tasks.length > 0 || ideas.length > 0;

  // Handlers
  const handleSaveProject = async (p: {
    id?: string;
    name: string;
    description: string;
    why: string;
    nextStep: string;
    status: string;
    priority: Priority;
    categoryId: string | null;
  }) => {
    const data = {
      name: p.name,
      description: p.description,
      why: p.why,
      nextStep: p.nextStep,
      status: p.status,
      priority: p.priority,
      categoryId: p.categoryId,
    };
    try {
      if (p.id) {
        await updateProjectM({ variables: { id: p.id, data } });
      } else {
        await createProject({ variables: { data } });
      }
    } catch {
      return; // errorLink already toasted; keep the modal open for retry
    }
    setShowProjectModal(false);
    setEditingProject(null);
  };

  const handleCreateCategory = async (input: { name: string; color: string }) => {
    try {
      const res = await createCategoryM({ variables: { data: input } });
      return (res.data?.createCategory as Category | undefined) ?? null;
    } catch {
      return null;
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Projects in it will become uncategorized.")) return;
    try {
      await deleteCategoryM({ variables: { id } });
    } catch {
      /* toasted globally */
    }
  };

  const handleSaveTask = async (t: {
    id?: string;
    title: string;
    projectId: string | null;
    dueDate: string | null;
    done: boolean;
  }) => {
    const data = {
      title: t.title,
      projectId: t.projectId,
      dueDate: t.dueDate,
      done: t.done,
    };
    try {
      if (t.id) {
        await updateTaskM({ variables: { id: t.id, data } });
      } else {
        await createTask({ variables: { data } });
      }
    } catch {
      return;
    }
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleToggleTask = async (t: Task) => {
    try {
      await toggleTaskM({ variables: { id: t.id } });
    } catch {
      /* toasted globally */
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTaskM({ variables: { id } });
    } catch {
      /* toasted globally */
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Delete this project and all its tasks?")) return;
    try {
      await deleteProjectM({ variables: { id } });
    } catch {
      /* toasted globally */
    }
  };

  const handleSaveIdea = async (i: { title: string; description: string }) => {
    try {
      await createIdea({ variables: { data: { ...i, why: "" } } });
    } catch {
      return;
    }
    setShowIdeaModal(false);
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      await deleteIdeaM({ variables: { id } });
    } catch {
      /* toasted globally */
    }
  };

  const handlePromoteIdea = async (id: string) => {
    try {
      await promoteIdeaM({ variables: { id } });
    } catch {
      /* toasted globally */
    }
  };

  const handleAddUpdate = async (projectId: string, note: string) => {
    try {
      await addUpdateM({ variables: { projectId, note } });
    } catch {
      return;
    }
    setShowUpdateModal(false);
  };

  const exportData = async () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      projects,
      tasks,
      ideas,
      updates,
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().split("T")[0];
    a.download = `continuity-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    try {
      await markBackupM();
      toast.success("Backup exported.");
    } catch {
      // markBackup failed but the file already downloaded — don't claim success
    }
    refetch();
  };

  const importData = async (file: File, mode: "merge" | "replace") => {
    let parsed: { version?: number; projects?: Project[]; tasks?: Task[]; ideas?: Idea[]; updates?: UpdateEntry[] };
    try {
      const text = await file.text();
      parsed = JSON.parse(text);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Could not read backup file: ${msg}`);
      return;
    }
    if (!parsed.version || !Array.isArray(parsed.projects)) {
      toast.error("Invalid backup file. Expected a Continuity export.");
      return;
    }

    try {
      if (mode === "replace") {
        await Promise.all(projects.map((p) => deleteProjectM({ variables: { id: p.id } })));
        await Promise.all(tasks.map((t) => deleteTaskM({ variables: { id: t.id } })));
        await Promise.all(ideas.map((i) => deleteIdeaM({ variables: { id: i.id } })));
      }

      // Recreate projects (server assigns new ids; we map old id -> new id for tasks/updates)
      const idMap: Record<string, string> = {};
      for (const p of parsed.projects as Project[]) {
        const res = await createProject({
          variables: {
            data: {
              name: p.name,
              description: p.description || "",
              why: p.why || "",
              nextStep: p.nextStep || "",
              status: p.status || "idea",
            },
          },
        });
        const newId = res.data?.createProject?.id;
        if (newId) idMap[p.id] = newId;
      }
      for (const t of (parsed.tasks || []) as Task[]) {
        await createTask({
          variables: {
            data: {
              title: t.title,
              projectId: t.projectId ? idMap[t.projectId] || null : null,
              dueDate: t.dueDate,
              done: !!t.done,
            },
          },
        });
      }
      for (const i of (parsed.ideas || []) as Idea[]) {
        await createIdea({
          variables: {
            data: { title: i.title, description: i.description || "", why: i.why || "" },
          },
        });
      }
      for (const u of (parsed.updates || []) as UpdateEntry[]) {
        const newProjectId = idMap[u.projectId];
        if (newProjectId) {
          await addUpdateM({ variables: { projectId: newProjectId, note: u.note } });
        }
      }
      await refetch();
      toast.success(
        `Imported ${parsed.projects?.length || 0} projects, ${parsed.tasks?.length || 0} tasks, ${parsed.ideas?.length || 0} ideas, ${parsed.updates?.length || 0} updates.`
      );
    } catch {
      // The errorLink already toasted whichever mutation failed; refresh to
      // reflect whatever did make it through.
      refetch();
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: "merge" | "replace"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importData(file, mode);
    e.target.value = "";
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md bg-zinc-900 border border-amber-500/30 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-semibold text-amber-300 mb-1">Couldn&apos;t load data</div>
              <div className="text-sm text-zinc-400 mb-3">Error: {error.message}</div>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg font-medium text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start justify-between mb-2 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Continuity
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex gap-2 text-xs items-center flex-wrap">
              <button
                onClick={() => setShowCategoriesModal(true)}
                className="px-2 sm:px-3 py-2 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center gap-2"
                title="Manage categories"
                aria-label="Manage categories"
              >
                <Tags size={14} />
                <span className="hidden sm:inline">Categories</span>
              </button>
              <button
                onClick={() => setShowBackupModal(true)}
                className={`px-2 sm:px-3 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                  backupOverdue && hasData
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
                aria-label="Backup"
              >
                <Database size={14} />
                <span className="hidden sm:inline">Backup</span>
              </button>
              <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-zinc-900 rounded-lg border border-zinc-800 leading-tight">
                <div className="text-zinc-500 text-[10px] sm:text-xs">Active</div>
                <div className="text-emerald-400 font-bold text-base sm:text-lg">{activeCount}</div>
              </div>
              <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-zinc-900 rounded-lg border border-zinc-800 leading-tight">
                <div className="text-zinc-500 text-[10px] sm:text-xs">Launched</div>
                <div className="text-blue-400 font-bold text-base sm:text-lg">{launchedCount}</div>
              </div>
              {stalled.length > 0 && (
                <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-amber-500/10 rounded-lg border border-amber-500/30 leading-tight">
                  <div className="text-amber-500/80 text-[10px] sm:text-xs">Stalled</div>
                  <div className="text-amber-400 font-bold text-base sm:text-lg">{stalled.length}</div>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="px-3 py-2 rounded-lg border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center gap-2"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-zinc-900 p-1 rounded-lg border border-zinc-800 w-full sm:w-fit overflow-x-auto">
          {(
            [
              { id: "today", label: "Today", icon: Target },
              { id: "projects", label: "Projects", icon: Activity },
              { id: "tasks", label: "Tasks", icon: CheckCircle2 },
              { id: "ideas", label: "Ideas", icon: Lightbulb },
              { id: "log", label: "Log", icon: TrendingUp },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={`px-2.5 sm:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 flex-1 sm:flex-none whitespace-nowrap ${
                  view === t.id ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* TODAY */}
        {view === "today" && (
          <div className="space-y-6">
            {backupOverdue && hasData && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Database className="text-blue-400 shrink-0 mt-0.5" size={18} />
                  <div className="flex-1">
                    <div className="font-semibold text-blue-300 mb-1">
                      {lastBackup
                        ? `Last backup ${daysSinceBackup} days ago`
                        : "No backup yet"}
                    </div>
                    <div className="text-sm text-blue-200/80 mb-2">
                      Export a JSON backup so you don&apos;t lose your data.
                    </div>
                    <button
                      onClick={() => setShowBackupModal(true)}
                      className="text-xs px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded-md text-blue-200"
                    >
                      Open backup tools
                    </button>
                  </div>
                </div>
              </div>
            )}

            {stalled.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Bell className="text-amber-400 shrink-0 mt-0.5" size={18} />
                  <div className="flex-1">
                    <div className="font-semibold text-amber-300 mb-1">
                      {stalled.length} project{stalled.length > 1 ? "s" : ""} need
                      {stalled.length === 1 ? "s" : ""} attention
                    </div>
                    <div className="text-sm text-amber-200/80">
                      No activity in 7+ days. Don&apos;t let them quietly die.
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {stalled.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedProject(p);
                            setView("projects");
                          }}
                          className="text-xs px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 rounded-md text-amber-200"
                        >
                          {p.name} · {daysSince(p.lastActivity)}d
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setShowTodayFocus((s) => !s)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setShowTodayFocus((s) => !s);
                  }
                }}
                aria-expanded={showTodayFocus}
                className="cursor-pointer select-none mb-3 flex items-center gap-2 flex-wrap rounded-md hover:bg-zinc-900/40 -mx-1 px-1 py-1"
              >
                <ChevronRight
                  size={16}
                  className={`text-zinc-500 transition-transform ${
                    showTodayFocus ? "rotate-90" : ""
                  }`}
                />
                <Target size={18} className="text-emerald-400" />
                <h2 className="text-lg font-semibold">Today&apos;s Focus</h2>
                {todayTaskCounts.total > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/40 text-orange-200 shadow-sm shadow-orange-500/10"
                    title={`${todayTaskCounts.dueToday} due today · ${todayTaskCounts.overdue} overdue`}
                  >
                    <Target size={11} className="text-orange-300" />
                    <span>
                      {todayTaskCounts.total}{" "}
                      {todayTaskCounts.total === 1 ? "task" : "tasks"}
                    </span>
                    {todayTaskCounts.overdue > 0 && (
                      <span className="text-red-300 font-semibold">
                        · {todayTaskCounts.overdue} overdue
                      </span>
                    )}
                  </span>
                )}
              </div>
              {showTodayFocus && (
                <>
                  {todayFocus.items.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                  <p className="text-zinc-400 mb-3">Nothing pressing today.</p>
                  <p className="text-sm text-zinc-500">
                    {projects.length === 0
                      ? "Add your first project to get started."
                      : "Add tasks or next steps to your active projects."}
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {todayFocus.items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all hover:border-zinc-700 ${
                        item.type === "overdue"
                          ? "bg-red-500/5 border-red-500/30"
                          : item.type === "today"
                          ? "bg-orange-500/5 border-orange-500/30"
                          : item.type === "stalled"
                          ? "bg-amber-500/5 border-amber-500/30"
                          : "bg-zinc-900 border-zinc-800"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`shrink-0 w-2 h-2 rounded-full mt-2 ${
                            item.type === "overdue"
                              ? "bg-red-400"
                              : item.type === "today"
                              ? "bg-orange-400"
                              : item.type === "stalled"
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs uppercase tracking-wider font-medium ${
                                item.type === "overdue"
                                  ? "text-red-400"
                                  : item.type === "today"
                                  ? "text-orange-400"
                                  : item.type === "stalled"
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                              }`}
                            >
                              {item.type === "overdue"
                                ? "Overdue"
                                : item.type === "today"
                                ? "Due today"
                                : item.type === "stalled"
                                ? "Stalled"
                                : "Next step"}
                            </span>
                            {item.type === "overdue" &&
                              item.task?.dueDate &&
                              (() => {
                                const n = daysOverdue(item.task.dueDate);
                                return n !== null ? (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-500/25 text-red-200 border border-red-500/50">
                                    {n}d late
                                  </span>
                                ) : null;
                              })()}
                            {item.project && (
                              <span className="text-xs text-zinc-500">
                                · {item.project.name}
                              </span>
                            )}
                          </div>
                          <div className="text-zinc-100">
                            {item.task
                              ? item.task.title
                              : item.type === "stalled" && item.project
                              ? `${item.project.name} — ${daysSince(item.project.lastActivity)} days idle`
                              : item.project?.nextStep}
                          </div>
                        </div>
                        {item.task && (
                          <button
                            onClick={() => handleToggleTask(item.task!)}
                            className="shrink-0 text-zinc-500 hover:text-emerald-400 transition-colors"
                          >
                            <CheckCircle2 size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
                  {todayFocus.total > todayFocus.items.length && (
                    <button
                      onClick={() => setView("tasks")}
                      className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-200 text-sm font-medium transition-colors"
                    >
                      View all tasks
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-500/30 text-orange-100">
                        +{todayFocus.total - todayFocus.items.length} more
                      </span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </>
              )}
            </div>

            {doneTodayItems.length > 0 && (() => {
              const taskCount = doneTodayItems.filter((i) => i.kind === "task").length;
              const logCount = doneTodayItems.filter((i) => i.kind === "log").length;
              const visibleItems =
                doneTodayFilter === "all"
                  ? doneTodayItems
                  : doneTodayItems.filter((i) => i.kind === doneTodayFilter);
              const toggleFilter = (kind: "task" | "log") =>
                setDoneTodayFilter((cur) => (cur === kind ? "all" : kind));
              return (
                <div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setShowDoneToday((s) => !s)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setShowDoneToday((s) => !s);
                      }
                    }}
                    aria-expanded={showDoneToday}
                    className="cursor-pointer select-none mb-3 flex items-center gap-2 flex-wrap rounded-md hover:bg-zinc-900/40 -mx-1 px-1 py-1"
                  >
                    <ChevronRight
                      size={16}
                      className={`text-zinc-500 transition-transform ${
                        showDoneToday ? "rotate-90" : ""
                      }`}
                    />
                    <Sparkles size={18} className="text-emerald-400" />
                    <h2 className="text-lg font-semibold">Done today</h2>
                    {taskCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFilter("task");
                        }}
                        aria-pressed={doneTodayFilter === "task"}
                        title={doneTodayFilter === "task" ? "Show all" : "Show only tasks"}
                        className={`text-xs font-normal rounded-full px-2 py-0.5 flex items-center gap-1 transition-colors ${
                          doneTodayFilter === "task"
                            ? "bg-emerald-500/25 border border-emerald-500/60 text-emerald-200"
                            : doneTodayFilter === "log"
                            ? "bg-emerald-500/5 border border-emerald-500/15 text-emerald-300/50 hover:text-emerald-300"
                            : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                        }`}
                      >
                        <CheckCircle2 size={11} />
                        {taskCount} {taskCount === 1 ? "task" : "tasks"}
                      </button>
                    )}
                    {logCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFilter("log");
                        }}
                        aria-pressed={doneTodayFilter === "log"}
                        title={doneTodayFilter === "log" ? "Show all" : "Show only logs"}
                        className={`text-xs font-normal rounded-full px-2 py-0.5 flex items-center gap-1 transition-colors ${
                          doneTodayFilter === "log"
                            ? "bg-blue-500/25 border border-blue-500/60 text-blue-200"
                            : doneTodayFilter === "task"
                            ? "bg-blue-500/5 border border-blue-500/15 text-blue-300/50 hover:text-blue-300"
                            : "bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                        }`}
                      >
                        <TrendingUp size={11} />
                        {logCount} {logCount === 1 ? "log" : "logs"}
                      </button>
                    )}
                  </div>
                  {showDoneToday && (
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3 sm:p-4">
                    <div className="space-y-2">
                      {visibleItems.map((item) => {
                        if (item.kind === "task") {
                          const t = item.task;
                          const proj = projects.find((p) => p.id === t.projectId);
                          return (
                            <div
                              key={`task-${t.id}`}
                              className="flex items-start gap-2 group border-l-2 border-emerald-500/40 pl-2.5"
                            >
                              <CheckCircle2
                                size={16}
                                className="text-emerald-400 shrink-0 mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                  <span className="text-[10px] uppercase tracking-wider font-medium text-emerald-400">
                                    Task
                                  </span>
                                  {proj && (
                                    <span className="text-xs text-zinc-500">
                                      · {proj.name}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-zinc-300 line-through decoration-emerald-500/40 break-words">
                                  {t.title}
                                </div>
                              </div>
                              <button
                                onClick={() => handleToggleTask(t)}
                                className="text-zinc-600 hover:text-amber-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                                title="Undo"
                                aria-label="Undo completion"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        }
                        const u = item.update;
                        const proj = projects.find((p) => p.id === u.projectId);
                        return (
                          <div
                            key={`log-${u.id}`}
                            className="flex items-start gap-2 border-l-2 border-blue-500/40 pl-2.5"
                          >
                            <TrendingUp
                              size={16}
                              className="text-blue-400 shrink-0 mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                <span className="text-[10px] uppercase tracking-wider font-medium text-blue-400">
                                  Log
                                </span>
                                {proj && (
                                  <span className="text-xs text-zinc-500">
                                    · {proj.name}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-zinc-300 break-words">
                                {u.note}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  )}
                </div>
              );
            })()}

            {projects.filter((p) => p.status === "active").length > 0 && (
              <div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setShowActiveProjects((s) => !s)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setShowActiveProjects((s) => !s);
                    }
                  }}
                  aria-expanded={showActiveProjects}
                  className="cursor-pointer select-none mb-3 flex items-center gap-2 flex-wrap rounded-md hover:bg-zinc-900/40 -mx-1 px-1 py-1"
                >
                  <ChevronRight
                    size={16}
                    className={`text-zinc-500 transition-transform ${
                      showActiveProjects ? "rotate-90" : ""
                    }`}
                  />
                  <Zap size={18} className="text-emerald-400" />
                  <h2 className="text-lg font-semibold">Active Projects</h2>
                  <span className="text-xs font-normal text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
                    {projects.filter((p) => p.status === "active").length}
                  </span>
                </div>
                {showActiveProjects && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {projects
                    .filter((p) => p.status === "active")
                    .map((p) => {
                      const projectTasks = tasks.filter((t) => t.projectId === p.id);
                      const done = projectTasks.filter((t) => t.done).length;
                      const days = daysSince(p.lastActivity) ?? 0;
                      const todayCount = projectTasks.filter(
                        (t) => !t.done && isDueToday(t.dueDate)
                      ).length;
                      const overdueCount = projectTasks.filter(
                        (t) => !t.done && isOverdue(t.dueDate)
                      ).length;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedProject(p);
                            setView("projects");
                          }}
                          className={`text-left bg-zinc-900 border rounded-xl p-4 hover:border-zinc-700 transition-all ${
                            overdueCount > 0
                              ? "border-red-500/40"
                              : todayCount > 0
                              ? "border-orange-500/40"
                              : "border-zinc-800"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span title={priorityMeta(p.priority).label}>
                              {priorityMeta(p.priority).emoji}
                            </span>
                            <span className="font-semibold truncate flex-1">
                              {p.name}
                            </span>
                            {overdueCount > 0 && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 shrink-0">
                                {overdueCount} overdue
                              </span>
                            )}
                            {todayCount > 0 && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 shrink-0">
                                {todayCount} today
                              </span>
                            )}
                          </div>
                          {p.categoryId && categoryById[p.categoryId] && (
                            <span
                              className={`inline-block text-xs px-2 py-0.5 rounded border mb-2 ${
                                categoryColorClass(
                                  categoryById[p.categoryId].color
                                ).chip
                              }`}
                            >
                              {categoryById[p.categoryId].name}
                            </span>
                          )}
                          {p.nextStep && (
                            <div className="text-sm text-zinc-400 mb-3 line-clamp-2">
                              → {p.nextStep}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>
                              {done}/{projectTasks.length} tasks
                            </span>
                            <span className={days > 6 ? "text-amber-400" : ""}>
                              {days}d ago
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
                )}
              </div>
            )}

            {launchedWithOpenTasks.length > 0 && (
              <div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setShowLaunchedWithTasks((s) => !s)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setShowLaunchedWithTasks((s) => !s);
                    }
                  }}
                  aria-expanded={showLaunchedWithTasks}
                  className="cursor-pointer select-none mb-3 flex items-center gap-2 flex-wrap rounded-md hover:bg-zinc-900/40 -mx-1 px-1 py-1"
                >
                  <ChevronRight
                    size={16}
                    className={`text-zinc-500 transition-transform ${
                      showLaunchedWithTasks ? "rotate-90" : ""
                    }`}
                  />
                  <Rocket size={18} className="text-blue-400" />
                  <h2 className="text-lg font-semibold">Launched · still has tasks</h2>
                  <span className="text-xs font-normal text-blue-400/80 bg-blue-500/10 border border-blue-500/30 rounded-full px-2 py-0.5">
                    {launchedWithOpenTasks.length}
                  </span>
                </div>
                {showLaunchedWithTasks && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {launchedWithOpenTasks.map(({ project: p, projectTasks, openCount }) => {
                    const done = projectTasks.filter((t) => t.done).length;
                    const todayCount = projectTasks.filter(
                      (t) => !t.done && isDueToday(t.dueDate)
                    ).length;
                    const overdueCount = projectTasks.filter(
                      (t) => !t.done && isOverdue(t.dueDate)
                    ).length;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProject(p);
                          setView("projects");
                        }}
                        className={`text-left bg-blue-500/5 border rounded-xl p-4 hover:border-blue-500/40 transition-all ${
                          overdueCount > 0
                            ? "border-red-500/40"
                            : todayCount > 0
                            ? "border-orange-500/40"
                            : "border-blue-500/20"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Rocket size={14} className="text-blue-400 shrink-0" />
                          <span className="font-semibold truncate flex-1">
                            {p.name}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 shrink-0">
                            {openCount} open
                          </span>
                          {overdueCount > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 shrink-0">
                              {overdueCount} overdue
                            </span>
                          )}
                          {todayCount > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 shrink-0">
                              {todayCount} today
                            </span>
                          )}
                        </div>
                        {p.categoryId && categoryById[p.categoryId] && (
                          <span
                            className={`inline-block text-xs px-2 py-0.5 rounded border mb-2 ${
                              categoryColorClass(
                                categoryById[p.categoryId].color
                              ).chip
                            }`}
                          >
                            {categoryById[p.categoryId].name}
                          </span>
                        )}
                        {p.nextStep && (
                          <div className="text-sm text-zinc-400 mb-3 line-clamp-2">
                            → {p.nextStep}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <span>
                            {done}/{projectTasks.length} tasks
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PROJECTS */}
        {view === "projects" && (
          <div>
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h2 className="text-lg font-semibold">All Projects</h2>
              <div className="flex items-center gap-2 flex-1 sm:max-w-md sm:ml-auto">
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    placeholder="Search by name, description, category..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-zinc-600"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingProject(null);
                    setShowProjectModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg font-medium text-sm flex items-center gap-2 shrink-0"
                >
                  <Plus size={16} /> New
                </button>
              </div>
            </div>

            {projects.length > 0 && (
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {STATUS_FILTER_ORDER.map((s) => {
                    const isActive = projectStatusFilter === s;
                    const count = projectStatusCounts[s] ?? 0;
                    if (s !== "all" && count === 0) return null;
                    const cfg = s === "all" ? null : statusConfig[s as ProjectStatus];
                    const label = s === "all" ? "All" : cfg?.label ?? s;
                    return (
                      <button
                        key={s}
                        onClick={() => setProjectStatusFilter(s)}
                        aria-pressed={isActive}
                        className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-colors ${
                          isActive
                            ? s === "all"
                              ? "bg-zinc-100/10 border-zinc-300/60 text-zinc-100"
                              : `${cfg?.color} ring-1 ring-current/40`
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                        }`}
                      >
                        <span>{label}</span>
                        <span
                          className={`text-[10px] px-1.5 rounded-full ${
                            isActive ? "bg-black/30" : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {categories.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setProjectCategoryFilter(null)}
                      aria-pressed={projectCategoryFilter === null}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        projectCategoryFilter === null
                          ? "bg-zinc-100/10 border-zinc-300/60 text-zinc-100"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                      }`}
                    >
                      All categories
                    </button>
                    {categories.map((c) => {
                      const isActive = projectCategoryFilter === c.id;
                      const cls = categoryColorClass(c.color);
                      return (
                        <button
                          key={c.id}
                          onClick={() =>
                            setProjectCategoryFilter(isActive ? null : c.id)
                          }
                          aria-pressed={isActive}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${
                            isActive
                              ? `${cls.chip} ring-1 ring-current/40`
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${cls.dot}`} />
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {projects.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                <p className="text-zinc-400 mb-4">No projects yet.</p>
                <button
                  onClick={() => {
                    setEditingProject(null);
                    setShowProjectModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg font-medium text-sm"
                >
                  Add your first project
                </button>
              </div>
            ) : (() => {
              const q = projectSearch.trim().toLowerCase();
              const matchesSearch = (p: Project) => {
                if (!q) return true;
                const cat = p.categoryId
                  ? categoryById[p.categoryId]?.name ?? ""
                  : "";
                return (
                  p.name.toLowerCase().includes(q) ||
                  p.description.toLowerCase().includes(q) ||
                  p.nextStep.toLowerCase().includes(q) ||
                  p.why.toLowerCase().includes(q) ||
                  cat.toLowerCase().includes(q)
                );
              };

              const matchesStatus = (p: Project) => {
                if (projectStatusFilter === "all") return true;
                if (projectStatusFilter === "stalled") {
                  if (p.status === "stalled") return true;
                  const idle = daysSince(p.lastActivity) ?? 0;
                  return ["active", "idea"].includes(p.status) && idle >= 7;
                }
                return p.status === projectStatusFilter;
              };

              const matchesCategory = (p: Project) =>
                projectCategoryFilter === null ||
                p.categoryId === projectCategoryFilter;

              const filtered = projects.filter(
                (p) => matchesSearch(p) && matchesStatus(p) && matchesCategory(p)
              );

              if (filtered.length === 0) {
                const reason = q
                  ? `No projects match "${projectSearch}"`
                  : "No projects match these filters";
                return (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-sm">
                    {reason}
                  </div>
                );
              }

              const urgencyBucket = (p: Project) => {
                const projectTasks = tasks.filter((t) => t.projectId === p.id);
                const hasOverdue = projectTasks.some(
                  (t) => !t.done && isOverdue(t.dueDate)
                );
                if (hasOverdue) return 0;
                const hasToday = projectTasks.some(
                  (t) => !t.done && isDueToday(t.dueDate)
                );
                if (hasToday) return 1;
                const idle = daysSince(p.lastActivity) ?? 0;
                if (["active", "idea"].includes(p.status) && idle >= 7) return 2;
                return 3;
              };

              return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 auto-rows-min">
                {[...filtered]
                  .sort((a, b) => {
                    const ba = urgencyBucket(a);
                    const bb = urgencyBucket(b);
                    if (ba !== bb) return ba - bb;
                    const pa = priorityRank(a.priority);
                    const pb = priorityRank(b.priority);
                    if (pa !== pb) return pa - pb;
                    return (
                      new Date(b.lastActivity).getTime() -
                      new Date(a.lastActivity).getTime()
                    );
                  })
                  .map((p) => {
                    const projectTasks = tasks.filter((t) => t.projectId === p.id);
                    const done = projectTasks.filter((t) => t.done).length;
                    const total = projectTasks.length;
                    const todayCount = projectTasks.filter(
                      (t) => !t.done && isDueToday(t.dueDate)
                    ).length;
                    const overdueCount = projectTasks.filter(
                      (t) => !t.done && isOverdue(t.dueDate)
                    ).length;
                    const StatusIcon = statusConfig[p.status]?.icon || Activity;
                    const days = daysSince(p.lastActivity) ?? 0;
                    const isStalled =
                      ["active", "idea"].includes(p.status) && days >= 7;
                    const isExpanded = selectedProject?.id === p.id;

                    return (
                      <div
                        key={p.id}
                        className={`bg-zinc-900 border border-l-4 rounded-xl overflow-hidden transition-all ${statusBorderClass[p.status]} ${
                          isStalled ? "border-amber-500/40" : "border-zinc-800"
                        } ${isExpanded ? "ring-1 ring-emerald-500/30 lg:col-span-2" : ""}`}
                      >
                        <div
                          className="p-4 cursor-pointer hover:bg-zinc-900/50"
                          onClick={() => setSelectedProject(isExpanded ? null : p)}
                        >
                          <div className="flex items-start gap-3">
                            <ChevronRight
                              size={18}
                              className={`shrink-0 mt-0.5 text-zinc-500 transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span
                                  className="text-sm"
                                  title={`Priority: ${priorityMeta(p.priority).label}`}
                                >
                                  {priorityMeta(p.priority).emoji}
                                </span>
                                <span className="font-semibold">{p.name}</span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1 ${statusConfig[p.status]?.color}`}
                                >
                                  <StatusIcon size={10} />
                                  {statusConfig[p.status]?.label}
                                </span>
                                {p.categoryId && categoryById[p.categoryId] && (
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded border ${
                                      categoryColorClass(
                                        categoryById[p.categoryId].color
                                      ).chip
                                    }`}
                                  >
                                    {categoryById[p.categoryId].name}
                                  </span>
                                )}
                                {overdueCount > 0 && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                                    {overdueCount} overdue
                                  </span>
                                )}
                                {todayCount > 0 && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40">
                                    {todayCount} today
                                  </span>
                                )}
                                {isStalled && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    {days}d idle
                                  </span>
                                )}
                              </div>
                              {p.nextStep && (
                                <div className="text-sm text-zinc-400 truncate">
                                  → {p.nextStep}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 shrink-0">
                              {total > 0 && `${done}/${total}`}
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-zinc-800 p-4 space-y-4">
                            {p.why && (
                              <div>
                                <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                                  Why this matters
                                </div>
                                <div className="text-sm text-zinc-300">{p.why}</div>
                              </div>
                            )}
                            {p.description && (
                              <div>
                                <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                                  Description
                                </div>
                                <div className="text-sm text-zinc-300">
                                  {p.description}
                                </div>
                              </div>
                            )}

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs uppercase tracking-wider text-zinc-500">
                                  Tasks
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTask({ projectId: p.id });
                                    setShowTaskModal(true);
                                  }}
                                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                >
                                  <Plus size={12} /> Add task
                                </button>
                              </div>
                              {projectTasks.length === 0 ? (
                                <div className="text-sm text-zinc-500 italic">
                                  No tasks yet
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {projectTasks.map((t) => (
                                    <div
                                      key={t.id}
                                      className="flex items-center gap-2 group py-1"
                                    >
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleTask(t);
                                        }}
                                        className={`shrink-0 ${
                                          t.done
                                            ? "text-emerald-400"
                                            : "text-zinc-600 hover:text-zinc-400"
                                        }`}
                                      >
                                        <CheckCircle2 size={16} />
                                      </button>
                                      <span
                                        className={`text-sm flex-1 ${
                                          t.done
                                            ? "line-through text-zinc-500"
                                            : "text-zinc-200"
                                        }`}
                                      >
                                        {t.title}
                                      </span>
                                      {t.dueDate && (
                                        <span className="text-xs text-zinc-500">
                                          {new Date(t.dueDate).toLocaleDateString()}
                                        </span>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteTask(t.id);
                                        }}
                                        className="text-zinc-600 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                                        aria-label="Delete task"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs uppercase tracking-wider text-zinc-500">
                                  Recent activity
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProject(p);
                                    setShowUpdateModal(true);
                                  }}
                                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                >
                                  <Plus size={12} /> Log update
                                </button>
                              </div>
                              <div className="space-y-1">
                                {updates
                                  .filter((u) => u.projectId === p.id)
                                  .slice(0, 3)
                                  .map((u) => (
                                    <div
                                      key={u.id}
                                      className="text-sm text-zinc-400 flex flex-col sm:flex-row gap-0.5 sm:gap-2"
                                    >
                                      <span className="text-zinc-600 text-xs shrink-0 sm:w-20">
                                        {new Date(u.date).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </span>
                                      <span className="break-words min-w-0">{u.note}</span>
                                    </div>
                                  ))}
                                {updates.filter((u) => u.projectId === p.id).length ===
                                  0 && (
                                  <div className="text-sm text-zinc-500 italic">
                                    No updates logged
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProject(p);
                                  setShowProjectModal(true);
                                }}
                                className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-md flex items-center gap-1"
                              >
                                <Edit2 size={12} /> Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProject(p.id);
                                }}
                                className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
              );
            })()}
          </div>
        )}

        {/* TASKS */}
        {view === "tasks" && (
          <div>
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h2 className="text-lg font-semibold">All Tasks</h2>
              <div className="flex items-center gap-2 flex-1 sm:max-w-md sm:ml-auto">
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder="Search tasks or project..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-zinc-600"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setShowTaskModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg font-medium text-sm flex items-center gap-2 shrink-0"
                >
                  <Plus size={16} /> New
                </button>
              </div>
            </div>
            {tasks.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-400">
                No tasks yet.
              </div>
            ) : (() => {
              const q = taskSearch.trim().toLowerCase();
              const filteredTasks = q
                ? tasks.filter((t) => {
                    const proj = projects.find((p) => p.id === t.projectId);
                    return (
                      t.title.toLowerCase().includes(q) ||
                      (proj?.name.toLowerCase().includes(q) ?? false)
                    );
                  })
                : tasks;

              if (filteredTasks.length === 0) {
                return (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-sm">
                    No tasks match &ldquo;{taskSearch}&rdquo;
                  </div>
                );
              }

              const todayBucket = filteredTasks
                .filter(
                  (t) =>
                    !t.done && t.dueDate && (isOverdue(t.dueDate) || isDueToday(t.dueDate))
                )
                .sort(
                  (a, b) =>
                    new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
                );

              const unscheduledBucket = filteredTasks
                .filter((t) => !t.done && !t.dueDate)
                .sort(
                  (a, b) =>
                    new Date(b.created).getTime() - new Date(a.created).getTime()
                );

              const upcomingBucket = filteredTasks
                .filter(
                  (t) =>
                    !t.done &&
                    t.dueDate &&
                    !isOverdue(t.dueDate) &&
                    !isDueToday(t.dueDate)
                )
                .sort(
                  (a, b) =>
                    new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
                );

              const doneBucket = filteredTasks
                .filter((t) => t.done)
                .sort((a, b) => {
                  const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
                  const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
                  return tb - ta;
                });

              const searching = q.length > 0;
              const todayOpen = searching || showTodayTasks;
              const unscheduledOpen = searching || showUnscheduledTasks;
              const upcomingOpen = searching || showUpcomingTasks;
              const doneOpen = searching || showDoneTasks;

              const renderRow = (t: Task, opts?: { canSchedule?: boolean }) => {
                const proj = projects.find((p) => p.id === t.projectId);
                const overdue = !t.done && isOverdue(t.dueDate);
                const dueToday = !t.done && isDueToday(t.dueDate);
                return (
                  <div
                    key={t.id}
                    className={`bg-zinc-900 border rounded-lg p-3 flex items-center gap-3 group ${
                      overdue
                        ? "border-red-500/30"
                        : dueToday
                        ? "border-orange-500/30"
                        : "border-zinc-800"
                    }`}
                  >
                    <button
                      onClick={() => handleToggleTask(t)}
                      className={
                        t.done
                          ? "text-emerald-400"
                          : "text-zinc-600 hover:text-zinc-400"
                      }
                      aria-label={t.done ? "Mark as not done" : "Mark as done"}
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div
                        className={
                          t.done ? "line-through text-zinc-500" : "text-zinc-100"
                        }
                      >
                        {t.title}
                      </div>
                      <div className="text-xs text-zinc-500 flex flex-wrap items-center gap-x-2 mt-0.5">
                        {proj && <span>{proj.name}</span>}
                        {t.dueDate ? (
                          <span
                            className={
                              overdue
                                ? "text-red-400"
                                : dueToday
                                ? "text-orange-400"
                                : ""
                            }
                          >
                            · {dueToday
                              ? "Due today"
                              : new Date(t.dueDate).toLocaleDateString()}
                          </span>
                        ) : opts?.canSchedule ? (
                          <button
                            onClick={() => {
                              setEditingTask(t);
                              setShowTaskModal(true);
                            }}
                            className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 hover:underline"
                          >
                            <CalendarPlus size={12} /> Add date
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="text-zinc-600 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                      aria-label="Delete task"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              };

              return (
                <div className="space-y-3">
                  <div className="border border-zinc-800 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setShowTodayTasks((s) => !s)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 bg-zinc-900 hover:bg-zinc-900/70 text-left"
                      aria-expanded={todayOpen}
                    >
                      <ChevronRight
                        size={16}
                        className={`text-zinc-500 transition-transform ${
                          todayOpen ? "rotate-90" : ""
                        }`}
                      />
                      <Target size={14} className="text-orange-400" />
                      <span className="text-sm font-medium text-zinc-200">
                        Today &amp; overdue
                      </span>
                      <span className="text-xs text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-full px-2 py-0.5">
                        {todayBucket.length}
                      </span>
                    </button>
                    {todayOpen && (
                      <div className="p-2 sm:p-3 bg-zinc-950/40 border-t border-zinc-800">
                        {todayBucket.length === 0 ? (
                          <div className="text-center text-sm text-zinc-500 py-4">
                            All clear — nothing due today. ✨
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {todayBucket.map((t) => renderRow(t))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {unscheduledBucket.length > 0 && (
                    <div className="border border-zinc-800 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setShowUnscheduledTasks((s) => !s)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 bg-zinc-900 hover:bg-zinc-900/70 text-left"
                        aria-expanded={unscheduledOpen}
                      >
                        <ChevronRight
                          size={16}
                          className={`text-zinc-500 transition-transform ${
                            unscheduledOpen ? "rotate-90" : ""
                          }`}
                        />
                        <CalendarPlus size={14} className="text-amber-400" />
                        <span className="text-sm font-medium text-zinc-200">
                          Pick a day
                        </span>
                        <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5">
                          {unscheduledBucket.length}
                        </span>
                        <span className="hidden sm:inline text-xs text-zinc-500 ml-1">
                          — schedule them so they happen
                        </span>
                      </button>
                      {unscheduledOpen && (
                        <div className="p-2 sm:p-3 space-y-2 bg-zinc-950/40 border-t border-zinc-800">
                          {unscheduledBucket.map((t) =>
                            renderRow(t, { canSchedule: true })
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {upcomingBucket.length > 0 && (
                    <div className="border border-zinc-800 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setShowUpcomingTasks((s) => !s)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 bg-zinc-900 hover:bg-zinc-900/70 text-left"
                        aria-expanded={upcomingOpen}
                      >
                        <ChevronRight
                          size={16}
                          className={`text-zinc-500 transition-transform ${
                            upcomingOpen ? "rotate-90" : ""
                          }`}
                        />
                        <Clock size={14} className="text-blue-400" />
                        <span className="text-sm font-medium text-zinc-200">
                          Upcoming
                        </span>
                        <span className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/30 rounded-full px-2 py-0.5">
                          {upcomingBucket.length}
                        </span>
                      </button>
                      {upcomingOpen && (
                        <div className="p-2 sm:p-3 space-y-2 bg-zinc-950/40 border-t border-zinc-800">
                          {upcomingBucket.map((t) => renderRow(t))}
                        </div>
                      )}
                    </div>
                  )}

                  {doneBucket.length > 0 && (
                    <div className="border border-zinc-800 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setShowDoneTasks((s) => !s)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 bg-zinc-900 hover:bg-zinc-900/70 text-left"
                        aria-expanded={doneOpen}
                      >
                        <ChevronRight
                          size={16}
                          className={`text-zinc-500 transition-transform ${
                            doneOpen ? "rotate-90" : ""
                          }`}
                        />
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span className="text-sm font-medium text-zinc-200">
                          Completed
                        </span>
                        <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
                          {doneBucket.length}
                        </span>
                      </button>
                      {doneOpen && (
                        <div className="p-2 sm:p-3 space-y-2 bg-zinc-950/40 border-t border-zinc-800">
                          {doneBucket.map((t) => renderRow(t))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* IDEAS */}
        {view === "ideas" && (
          <div>
            <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
              <h2 className="text-lg font-semibold">Ideas Parking Lot</h2>
              <div className="flex items-center gap-2 flex-1 sm:max-w-md sm:ml-auto">
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={ideaSearch}
                    onChange={(e) => setIdeaSearch(e.target.value)}
                    placeholder="Search ideas..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-zinc-600"
                  />
                </div>
                <button
                  onClick={() => setShowIdeaModal(true)}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 shrink-0"
                >
                  <Plus size={16} /> Capture
                </button>
              </div>
            </div>
            <p className="text-sm text-zinc-500 mb-4">
              Park new ideas here so you don&apos;t abandon current projects. Promote them when you&apos;re ready.
            </p>
            {ideas.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-400">
                No ideas captured yet.
              </div>
            ) : (() => {
              const q = ideaSearch.trim().toLowerCase();
              const filteredIdeas = q
                ? ideas.filter(
                    (i) =>
                      i.title.toLowerCase().includes(q) ||
                      i.description.toLowerCase().includes(q) ||
                      i.why.toLowerCase().includes(q)
                  )
                : ideas;

              if (filteredIdeas.length === 0) {
                return (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-sm">
                    No ideas match &ldquo;{ideaSearch}&rdquo;
                  </div>
                );
              }

              return (
              <div className="grid sm:grid-cols-2 gap-3">
                {filteredIdeas.map((i) => (
                  <div
                    key={i.id}
                    className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Lightbulb className="text-purple-400 shrink-0 mt-0.5" size={16} />
                      <div className="font-semibold text-purple-100 flex-1">
                        {i.title}
                      </div>
                    </div>
                    {i.description && (
                      <div className="text-sm text-zinc-400 mb-3">{i.description}</div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePromoteIdea(i.id)}
                        className="text-xs px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded-md"
                      >
                        Promote to project
                      </button>
                      <button
                        onClick={() => handleDeleteIdea(i.id)}
                        className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-md"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              );
            })()}
          </div>
        )}

        {/* LOG */}
        {view === "log" && (
          <div>
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h2 className="text-lg font-semibold">Activity Log</h2>
              <div className="relative flex-1 sm:max-w-md sm:ml-auto">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Search log entries or project..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-zinc-600"
                />
              </div>
            </div>
            {updates.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-400">
                No activity logged yet. Log updates from your projects to track momentum.
              </div>
            ) : (() => {
              const q = logSearch.trim().toLowerCase();
              const filteredUpdates = q
                ? updates.filter((u) => {
                    const proj = projects.find((p) => p.id === u.projectId);
                    return (
                      u.note.toLowerCase().includes(q) ||
                      (proj?.name.toLowerCase().includes(q) ?? false)
                    );
                  })
                : updates;

              if (filteredUpdates.length === 0) {
                return (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-sm">
                    No log entries match &ldquo;{logSearch}&rdquo;
                  </div>
                );
              }

              return (
              <div className="space-y-2">
                {filteredUpdates.map((u) => {
                  const proj = projects.find((p) => p.id === u.projectId);
                  return (
                    <div
                      key={u.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col sm:flex-row gap-1 sm:gap-3"
                    >
                      <div className="text-xs text-zinc-500 shrink-0 sm:w-24">
                        {new Date(u.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="flex-1 min-w-0">
                        {proj && (
                          <div className="text-xs text-emerald-400 mb-0.5">
                            {proj.name}
                          </div>
                        )}
                        <div className="text-sm text-zinc-200 break-words">{u.note}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              );
            })()}
          </div>
        )}
      </div>

      {showProjectModal && (
        <ProjectModal
          project={editingProject}
          categories={categories}
          onSave={handleSaveProject}
          onCreateCategory={handleCreateCategory}
          onClose={() => {
            setShowProjectModal(false);
            setEditingProject(null);
          }}
        />
      )}

      {showCategoriesModal && (
        <CategoryManagementModal
          categories={categories}
          onDelete={handleDeleteCategory}
          onClose={() => setShowCategoriesModal(false)}
        />
      )}

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          projects={projects}
          onSave={handleSaveTask}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
        />
      )}

      {showIdeaModal && (
        <IdeaModal onSave={handleSaveIdea} onClose={() => setShowIdeaModal(false)} />
      )}

      {showUpdateModal && selectedProject && (
        <UpdateModal
          projectName={selectedProject.name}
          onSave={(note) => handleAddUpdate(selectedProject.id, note)}
          onClose={() => setShowUpdateModal(false)}
        />
      )}

      {showBackupModal && (
        <Modal title="Backup & Restore" onClose={() => setShowBackupModal(false)}>
          <div className="space-y-4">
            <div className="text-sm text-zinc-400">
              Export a JSON file with all your projects, tasks, ideas, and activity log.
              Save it somewhere safe (Google Drive, Dropbox, iCloud).
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 text-sm">
              <div className="text-zinc-300 font-medium mb-1">Current data</div>
              <div className="text-zinc-500 text-xs">
                {projects.length} projects · {tasks.length} tasks · {ideas.length} ideas ·{" "}
                {updates.length} updates
              </div>
              {lastBackup && (
                <div className="text-zinc-500 text-xs mt-1">
                  Last backup: {new Date(lastBackup).toLocaleString()}
                </div>
              )}
            </div>

            <div>
              <button
                onClick={exportData}
                className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
              >
                <Download size={16} /> Export to JSON file
              </button>
            </div>

            <div className="border-t border-zinc-800 pt-4">
              <div className="text-zinc-300 font-medium text-sm mb-2">Restore from backup</div>
              <div className="text-xs text-zinc-500 mb-3">
                Select a previously exported JSON file. Choose how to handle existing data:
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.dataset.mode = "merge";
                      fileInputRef.current.click();
                    }
                  }}
                  className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <Upload size={14} /> Import & merge with current data
                </button>
                <button
                  onClick={() => {
                    if (
                      !confirm(
                        "This will DELETE all current data and replace it with the backup. Continue?"
                      )
                    )
                      return;
                    if (fileInputRef.current) {
                      fileInputRef.current.dataset.mode = "replace";
                      fileInputRef.current.click();
                    }
                  }}
                  className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <Upload size={14} /> Import & replace all data
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={(e) =>
                  handleFileSelect(
                    e,
                    (e.target.dataset.mode as "merge" | "replace") || "merge"
                  )
                }
                className="hidden"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
