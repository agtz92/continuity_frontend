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
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import {
  ADD_UPDATE,
  CREATE_IDEA,
  CREATE_PROJECT,
  CREATE_TASK,
  DASHBOARD_QUERY,
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
  DashboardData,
  Idea,
  Project,
  ProjectStatus,
  Task,
  UpdateEntry,
} from "@/lib/types";
import { IdeaModal, ProjectModal, TaskModal, UpdateModal } from "./modals";
import { Modal } from "./ui";

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
  const [markBackupM] = useMutation(MARK_BACKUP);

  const [view, setView] = useState<View>("today");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const projects = data?.dashboard.projects ?? [];
  const tasks = data?.dashboard.tasks ?? [];
  const ideas = data?.dashboard.ideas ?? [];
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
    const now = new Date();

    tasks
      .filter((t) => !t.done && t.dueDate && new Date(t.dueDate) < now)
      .forEach((t) =>
        focus.push({
          type: "overdue",
          task: t,
          project: projects.find((p) => p.id === t.projectId),
        })
      );

    tasks
      .filter((t) => {
        if (t.done || !t.dueDate) return false;
        return new Date(t.dueDate).toDateString() === now.toDateString();
      })
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

    return focus.slice(0, 6);
  }, [projects, tasks, stalled]);

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
  }) => {
    const data = {
      name: p.name,
      description: p.description,
      why: p.why,
      nextStep: p.nextStep,
      status: p.status,
    };
    if (p.id) {
      await updateProjectM({ variables: { id: p.id, data } });
    } else {
      await createProject({ variables: { data } });
    }
    setShowProjectModal(false);
    setEditingProject(null);
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
    if (t.id) {
      await updateTaskM({ variables: { id: t.id, data } });
    } else {
      await createTask({ variables: { data } });
    }
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleToggleTask = async (t: Task) => {
    await toggleTaskM({ variables: { id: t.id } });
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTaskM({ variables: { id } });
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Delete this project and all its tasks?")) return;
    await deleteProjectM({ variables: { id } });
  };

  const handleSaveIdea = async (i: { title: string; description: string }) => {
    await createIdea({ variables: { data: { ...i, why: "" } } });
    setShowIdeaModal(false);
  };

  const handleDeleteIdea = async (id: string) => {
    await deleteIdeaM({ variables: { id } });
  };

  const handlePromoteIdea = async (id: string) => {
    await promoteIdeaM({ variables: { id } });
  };

  const handleAddUpdate = async (projectId: string, note: string) => {
    await addUpdateM({ variables: { projectId, note } });
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
    await markBackupM();
    refetch();
  };

  const importData = async (file: File, mode: "merge" | "replace") => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.version || !Array.isArray(parsed.projects)) {
        alert("Invalid backup file. Expected a Continuity export.");
        return;
      }

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
      alert(
        `Imported ${parsed.projects?.length || 0} projects, ${parsed.tasks?.length || 0} tasks, ${parsed.ideas?.length || 0} ideas, ${parsed.updates?.length || 0} updates.`
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`Import failed: ${msg}`);
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
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-2 flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
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
                onClick={() => setShowBackupModal(true)}
                className={`px-3 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                  backupOverdue && hasData
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Database size={14} />
                <span>Backup</span>
              </button>
              <div className="px-3 py-2 bg-zinc-900 rounded-lg border border-zinc-800">
                <div className="text-zinc-500">Active</div>
                <div className="text-emerald-400 font-bold text-lg">{activeCount}</div>
              </div>
              <div className="px-3 py-2 bg-zinc-900 rounded-lg border border-zinc-800">
                <div className="text-zinc-500">Launched</div>
                <div className="text-blue-400 font-bold text-lg">{launchedCount}</div>
              </div>
              {stalled.length > 0 && (
                <div className="px-3 py-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <div className="text-amber-500/80">Stalled</div>
                  <div className="text-amber-400 font-bold text-lg">{stalled.length}</div>
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
        <div className="flex gap-1 mb-6 bg-zinc-900 p-1 rounded-lg border border-zinc-800 w-fit">
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
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
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
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Target size={18} className="text-emerald-400" />
                Today&apos;s Focus
              </h2>
              {todayFocus.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                  <p className="text-zinc-400 mb-3">Nothing pressing today.</p>
                  <p className="text-sm text-zinc-500">
                    {projects.length === 0
                      ? "Add your first project to get started."
                      : "Add tasks or next steps to your active projects."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {todayFocus.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all hover:border-zinc-700 ${
                        item.type === "overdue"
                          ? "bg-red-500/5 border-red-500/30"
                          : item.type === "today"
                          ? "bg-blue-500/5 border-blue-500/30"
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
                              ? "bg-blue-400"
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
                                  ? "text-blue-400"
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
            </div>

            {projects.filter((p) => p.status === "active").length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Zap size={18} className="text-emerald-400" />
                  Active Projects
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {projects
                    .filter((p) => p.status === "active")
                    .map((p) => {
                      const projectTasks = tasks.filter((t) => t.projectId === p.id);
                      const done = projectTasks.filter((t) => t.done).length;
                      const days = daysSince(p.lastActivity) ?? 0;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedProject(p);
                            setView("projects");
                          }}
                          className="text-left bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all"
                        >
                          <div className="font-semibold mb-1 truncate">{p.name}</div>
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
              </div>
            )}
          </div>
        )}

        {/* PROJECTS */}
        {view === "projects" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">All Projects</h2>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setShowProjectModal(true);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg font-medium text-sm flex items-center gap-2"
              >
                <Plus size={16} /> New Project
              </button>
            </div>

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
            ) : (
              <div className="grid gap-3">
                {[...projects]
                  .sort((a, b) => {
                    const order: Record<string, number> = {
                      active: 0,
                      idea: 1,
                      stalled: 2,
                      paused: 3,
                      launched: 4,
                      archived: 5,
                    };
                    return (order[a.status] ?? 99) - (order[b.status] ?? 99);
                  })
                  .map((p) => {
                    const projectTasks = tasks.filter((t) => t.projectId === p.id);
                    const done = projectTasks.filter((t) => t.done).length;
                    const total = projectTasks.length;
                    const StatusIcon = statusConfig[p.status]?.icon || Activity;
                    const days = daysSince(p.lastActivity) ?? 0;
                    const isStalled =
                      ["active", "idea"].includes(p.status) && days >= 7;
                    const isExpanded = selectedProject?.id === p.id;

                    return (
                      <div
                        key={p.id}
                        className={`bg-zinc-900 border rounded-xl overflow-hidden transition-all ${
                          isStalled ? "border-amber-500/40" : "border-zinc-800"
                        } ${isExpanded ? "ring-1 ring-emerald-500/30" : ""}`}
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
                                <span className="font-semibold">{p.name}</span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1 ${statusConfig[p.status]?.color}`}
                                >
                                  <StatusIcon size={10} />
                                  {statusConfig[p.status]?.label}
                                </span>
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
                                        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
                                      className="text-sm text-zinc-400 flex gap-2"
                                    >
                                      <span className="text-zinc-600 text-xs shrink-0 w-20">
                                        {new Date(u.date).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </span>
                                      <span>{u.note}</span>
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
            )}
          </div>
        )}

        {/* TASKS */}
        {view === "tasks" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">All Tasks</h2>
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowTaskModal(true);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg font-medium text-sm flex items-center gap-2"
              >
                <Plus size={16} /> New Task
              </button>
            </div>
            {tasks.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-400">
                No tasks yet.
              </div>
            ) : (
              <div className="space-y-2">
                {[...tasks]
                  .sort((a, b) => {
                    if (a.done !== b.done) return a.done ? 1 : -1;
                    if (a.dueDate && b.dueDate)
                      return (
                        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                      );
                    if (a.dueDate) return -1;
                    if (b.dueDate) return 1;
                    return 0;
                  })
                  .map((t) => {
                    const proj = projects.find((p) => p.id === t.projectId);
                    const overdue =
                      !t.done && t.dueDate && new Date(t.dueDate) < new Date();
                    return (
                      <div
                        key={t.id}
                        className={`bg-zinc-900 border rounded-lg p-3 flex items-center gap-3 group ${
                          overdue ? "border-red-500/30" : "border-zinc-800"
                        }`}
                      >
                        <button
                          onClick={() => handleToggleTask(t)}
                          className={
                            t.done
                              ? "text-emerald-400"
                              : "text-zinc-600 hover:text-zinc-400"
                          }
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
                          <div className="text-xs text-zinc-500 flex gap-2 mt-0.5">
                            {proj && <span>{proj.name}</span>}
                            {t.dueDate && (
                              <span className={overdue ? "text-red-400" : ""}>
                                · {new Date(t.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* IDEAS */}
        {view === "ideas" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Ideas Parking Lot</h2>
              <button
                onClick={() => setShowIdeaModal(true)}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium text-sm flex items-center gap-2"
              >
                <Plus size={16} /> Capture Idea
              </button>
            </div>
            <p className="text-sm text-zinc-500 mb-4">
              Park new ideas here so you don&apos;t abandon current projects. Promote them when you&apos;re ready.
            </p>
            {ideas.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-400">
                No ideas captured yet.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {ideas.map((i) => (
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
            )}
          </div>
        )}

        {/* LOG */}
        {view === "log" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Activity Log</h2>
            {updates.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-400">
                No activity logged yet. Log updates from your projects to track momentum.
              </div>
            ) : (
              <div className="space-y-2">
                {updates.map((u) => {
                  const proj = projects.find((p) => p.id === u.projectId);
                  return (
                    <div
                      key={u.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex gap-3"
                    >
                      <div className="text-xs text-zinc-500 shrink-0 w-24">
                        {new Date(u.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="flex-1">
                        {proj && (
                          <div className="text-xs text-emerald-400 mb-0.5">
                            {proj.name}
                          </div>
                        )}
                        <div className="text-sm text-zinc-200">{u.note}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showProjectModal && (
        <ProjectModal
          project={editingProject}
          onSave={handleSaveProject}
          onClose={() => {
            setShowProjectModal(false);
            setEditingProject(null);
          }}
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
