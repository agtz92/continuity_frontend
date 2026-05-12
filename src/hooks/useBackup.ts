"use client";

import { useMutation } from "@apollo/client";
import {
  CREATE_PROJECT_NOTE,
  DASHBOARD_QUERY,
  MARK_BACKUP,
} from "@/lib/graphql";
import { toast } from "@/lib/toast";
import { daysSince } from "@/lib/date";
import type {
  Activity,
  Idea,
  Project,
  ProjectNote,
  Task,
} from "@/lib/types";
import { useProjectMutations } from "./useProjectMutations";
import { useTaskMutations } from "./useTaskMutations";
import { useIdeaMutations } from "./useIdeaMutations";
import { useNoteMutations } from "./useNoteMutations";

type Snapshot = {
  projects: Project[];
  tasks: Task[];
  ideas: Idea[];
  activities: Activity[];
  projectNotes: ProjectNote[];
};

// Legacy snapshot shape (pre-unification): `updates` field with a flat list
// of user-authored notes. We still accept these on import and restore them
// as kind=NOTE activities; achievements aren't reconstructed.
type LegacyUpdate = {
  id: string;
  projectId: string;
  note: string;
  date: string;
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
  const noteMut = useNoteMutations();
  const [createNoteRaw] = useMutation(CREATE_PROJECT_NOTE);

  const daysSinceBackup = lastBackup ? daysSince(lastBackup) : null;
  const backupOverdue =
    !lastBackup || (daysSinceBackup !== null && daysSinceBackup >= 7);

  const exportData = async () => {
    const payload = {
      version: 2,
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
      activities?: Activity[];
      updates?: LegacyUpdate[]; // legacy v1 backups
      projectNotes?: ProjectNote[];
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

      // Recreate projects (server assigns new ids; map old → new for tasks/notes).
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
              dueDate: p.dueDate ?? null,
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

      // Note import: prefer v2 `activities` (only kind=note); fall back to v1
      // legacy `updates`. We deliberately only restore notes — achievements
      // (task_completed, project_created, …) are runtime observations, not
      // user data.
      let restoredNotes = 0;
      const noteActivities = (parsed.activities || []).filter(
        (a) => a.kind === "note"
      );
      for (const a of noteActivities) {
        const newProjectId = a.projectId ? idMap[a.projectId] : null;
        if (newProjectId) {
          await noteMut.raw.addNote({
            variables: { projectId: newProjectId, note: a.note },
          });
          restoredNotes += 1;
        }
      }
      for (const u of parsed.updates || []) {
        const newProjectId = idMap[u.projectId];
        if (newProjectId) {
          await noteMut.raw.addNote({
            variables: { projectId: newProjectId, note: u.note },
          });
          restoredNotes += 1;
        }
      }

      for (const n of (parsed.projectNotes || []) as ProjectNote[]) {
        const newProjectId = idMap[n.projectId];
        if (newProjectId) {
          await createNoteRaw({
            variables: {
              data: {
                projectId: newProjectId,
                title: n.title || "",
                body: n.body || "",
              },
            },
          });
        }
      }
      await refetch();
      toast.success(
        `Imported ${parsed.projects?.length || 0} projects, ${parsed.tasks?.length || 0} tasks, ${parsed.ideas?.length || 0} ideas, ${restoredNotes} notes, ${parsed.projectNotes?.length || 0} project notes.`
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
