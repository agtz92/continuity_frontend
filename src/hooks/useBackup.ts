"use client";

import { useMutation } from "@apollo/client";
import { DASHBOARD_QUERY, MARK_BACKUP } from "@/lib/graphql";
import { toast } from "@/lib/toast";
import { daysSince } from "@/lib/date";
import type { Idea, Project, Task, UpdateEntry } from "@/lib/types";
import { useProjectMutations } from "./useProjectMutations";
import { useTaskMutations } from "./useTaskMutations";
import { useIdeaMutations } from "./useIdeaMutations";
import { useUpdateMutations } from "./useUpdateMutations";

type Snapshot = {
  projects: Project[];
  tasks: Task[];
  ideas: Idea[];
  updates: UpdateEntry[];
};

export function useBackup({
  snapshot,
  lastBackup,
  refetch,
}: {
  /** Current dashboard data — used as the export source and for "replace" cleanup. */
  snapshot: Snapshot;
  lastBackup: string | null;
  refetch: () => Promise<unknown>;
}) {
  const [markBackupM] = useMutation(MARK_BACKUP, {
    refetchQueries: [{ query: DASHBOARD_QUERY }],
  });
  const projectMut = useProjectMutations();
  const taskMut = useTaskMutations();
  const ideaMut = useIdeaMutations();
  const updateMut = useUpdateMutations();

  const daysSinceBackup = lastBackup ? daysSince(lastBackup) : null;
  const backupOverdue =
    !lastBackup || (daysSinceBackup !== null && daysSinceBackup >= 7);

  const exportData = async () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      ...snapshot,
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
    let parsed: {
      version?: number;
      projects?: Project[];
      tasks?: Task[];
      ideas?: Idea[];
      updates?: UpdateEntry[];
    };
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
        await Promise.all(
          snapshot.projects.map((p) =>
            projectMut.raw.deleteProject({ variables: { id: p.id } })
          )
        );
        await Promise.all(
          snapshot.tasks.map((t) =>
            taskMut.raw.deleteTask({ variables: { id: t.id } })
          )
        );
        await Promise.all(
          snapshot.ideas.map((i) =>
            ideaMut.raw.deleteIdea({ variables: { id: i.id } })
          )
        );
      }

      // Recreate projects (server assigns new ids; map old → new for tasks/updates).
      const idMap: Record<string, string> = {};
      for (const p of parsed.projects as Project[]) {
        const res = await projectMut.raw.createProject({
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
        await taskMut.raw.createTask({
          variables: {
            data: {
              title: t.title,
              projectId: t.projectId ? idMap[t.projectId] || null : null,
              dueDate: t.dueDate,
              done: !!t.done,
              effortHours: t.effortHours ?? null,
            },
          },
        });
      }
      for (const i of (parsed.ideas || []) as Idea[]) {
        await ideaMut.raw.createIdea({
          variables: {
            data: { title: i.title, description: i.description || "", why: i.why || "" },
          },
        });
      }
      for (const u of (parsed.updates || []) as UpdateEntry[]) {
        const newProjectId = idMap[u.projectId];
        if (newProjectId) {
          await updateMut.raw.addUpdate({
            variables: { projectId: newProjectId, note: u.note },
          });
        }
      }
      await refetch();
      toast.success(
        `Imported ${parsed.projects?.length || 0} projects, ${parsed.tasks?.length || 0} tasks, ${parsed.ideas?.length || 0} ideas, ${parsed.updates?.length || 0} updates.`
      );
    } catch {
      // errorLink already toasted whichever mutation failed; refresh state.
      refetch();
    }
  };

  return {
    exportData,
    importData,
    daysSinceBackup,
    backupOverdue,
  };
}
