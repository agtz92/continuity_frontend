"use client";

/**
 * Lista de tareas pendientes de un proyecto, reordenable por arrastre (handle ⠿).
 * Mismo patrón que las secciones de Quick Notes (`QuickNotesView`): `@dnd-kit`
 * con sensor de puntero (5 px antes de arrancar, para no robarle el click al
 * toggle) y de teclado. El orden se persiste con `reorderProjectTasks`, que
 * responde optimista, así que la fila no rebota al soltar.
 *
 * Solo las pendientes se ordenan a mano: las completadas siguen por fecha de
 * cierre, debajo, en el `ShowMoreList` del panel.
 *
 * Mover también cuenta como replanear: al soltar, la tarea toma la fecha de la
 * vecina que rebasó (`suggestDueDateAfterMove`). Sin fecha propia se aplica
 * sola con un aviso; con fecha, solo si quedó fuera de orden y preguntando.
 */

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Task } from "@/lib/types";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { suggestDueDateAfterMove } from "@/lib/taskOrder";
import { confirmDialog } from "@/lib/confirm";
import { toast } from "@/lib/toast";
import { ProjectTaskRow } from "./ProjectTaskRow";

interface Props {
  projectId: string;
  /** Pendientes, ya en orden manual (`byManualOrder`). */
  tasks: Task[];
  onToggleTask: (t: Task) => void | Promise<void>;
  onEditTask: (t: Task) => void;
  onDeleteTask?: (id: string) => void | Promise<void>;
}

export function SortableProjectTasks({
  projectId,
  tasks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
}: Props) {
  const { reorderProjectTasks, saveTask } = useTaskMutations();
  const locale = useLocale();
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" });

  const applyDate = (task: Task, dueDate: string) =>
    saveTask({
      id: task.id,
      title: task.title,
      projectId: task.projectId,
      dueDate,
      done: task.done,
      effortHours: task.effortHours,
      dueTime: task.dueTime,
      durationMinutes: task.durationMinutes,
    });

  const reschedule = async (task: Task, ordered: Task[], direction: "up" | "down") => {
    const dueDate = suggestDueDateAfterMove(ordered, task.id, direction);
    if (!dueDate) return;
    if (!task.dueDate) {
      if (await applyDate(task, dueDate)) {
        toast.successKey("views.projects.card.dateAutoSet", { date: fmt(dueDate) });
      }
      return;
    }
    const ok = await confirmDialog({
      titleKey: "views.projects.card.moveDateTitle",
      bodyKey: "views.projects.card.moveDateBody",
      values: { title: task.title, from: fmt(task.dueDate), to: fmt(dueDate) },
      confirmKey: "views.projects.card.moveDateConfirm",
      cancelKey: "views.projects.card.moveDateKeep",
      tone: "neutral",
    });
    if (ok) await applyDate(task, dueDate);
  };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = tasks.map((t) => t.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const ordered = arrayMove(tasks, oldIndex, newIndex);
    void reorderProjectTasks(
      projectId,
      ordered.map((t) => t.id)
    );
    void reschedule(tasks[oldIndex], ordered, newIndex < oldIndex ? "up" : "down");
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => (
          <SortableTaskItem
            key={task.id}
            task={task}
            onToggleTask={onToggleTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableTaskItem({
  task,
  onToggleTask,
  onEditTask,
  onDeleteTask,
}: {
  task: Task;
  onToggleTask: Props["onToggleTask"];
  onEditTask: Props["onEditTask"];
  onDeleteTask?: Props["onDeleteTask"];
}) {
  const t = useTranslations("views.projects.card");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="group/sortable flex items-center gap-1">
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={t("dragTask")}
        className="p-0.5 -ml-1 text-text-4 hover:text-text cursor-grab active:cursor-grabbing touch-none sm:opacity-0 sm:group-hover/sortable:opacity-100 focus-visible:opacity-100 transition-opacity shrink-0"
      >
        <GripVertical size={14} />
      </button>
      <div className="flex-1 min-w-0">
        <ProjectTaskRow
          task={task}
          onToggleTask={onToggleTask}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
        />
      </div>
    </div>
  );
}
