"use client";

/**
 * Piezas de presentación/DND de la lista de proyectos, extraídas de
 * ProjectsView.tsx (ver AUDITORIA_CODIGO.md): cabecera de sección (Smart),
 * banner de re-orden, y la lista manual con drag & drop (dnd-kit). Reciben el
 * render de fila (`renderRow`) como callback, así que no arrastran props de
 * datos — ProjectsView sigue dueño de cómo se pinta cada fila.
 */

import type { CSSProperties, ReactNode } from "react";
import { ArrowDownUp, ChevronRight, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Project } from "@/lib/types";
import { Meta } from "@/components/ui/Meta";


/** Opt-in re-sort banner (A): shown when an edit made the live order diverge
 *  from the frozen one, so the user reorders on demand instead of mid-edit. */
export function ReorderPill({
  label,
  cta,
  onClick,
}: {
  label: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-accent-a35 bg-accent-a12 px-3 py-2 text-sm">
      <span className="text-text-muted">{label}</span>
      <button
        onClick={onClick}
        className="shrink-0 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-accent-a12 hover:bg-accent-a22 text-accent border border-accent-a35"
      >
        <ArrowDownUp size={12} /> {cta}
      </button>
    </div>
  );
}

/** One draggable row in manual mode (D). Wraps the shared row renderer and
 *  injects a grip handle wired to dnd-kit's sortable listeners. */
function SortableProjectRow({
  project,
  renderRow,
  disabled,
  reorderLabel,
}: {
  project: Project;
  renderRow: (p: Project, dragHandle?: ReactNode) => ReactNode;
  disabled: boolean;
  reorderLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id, disabled });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    zIndex: isDragging ? 20 : undefined,
    position: "relative",
  };
  const handle = disabled ? null : (
    <button
      type="button"
      aria-label={reorderLabel}
      onClick={(e) => e.stopPropagation()}
      className="shrink-0 -ml-1 mt-1 text-text-muted hover:text-text cursor-grab active:cursor-grabbing touch-none"
      {...attributes}
      {...listeners}
    >
      <GripVertical size={16} />
    </button>
  );
  return (
    <div ref={setNodeRef} style={style}>
      {renderRow(project, handle)}
    </div>
  );
}

/** Manual-order list (D): drag-to-reorder when no filters narrow the set,
 *  otherwise a read-only hint explaining why dragging is off. */
export function ManualProjectList({
  order,
  dragEnabled,
  sensors,
  onDragEnd,
  renderRow,
  hint,
}: {
  order: Project[];
  dragEnabled: boolean;
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  renderRow: (p: Project, dragHandle?: ReactNode) => ReactNode;
  hint: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-text-muted px-1">
        <ArrowDownUp size={12} />
        <span>{hint}</span>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={order.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col divide-y divide-border border border-border rounded-lg overflow-hidden bg-surface">
            {order.map((p) => (
              <SortableProjectRow
                key={p.id}
                project={p}
                renderRow={renderRow}
                disabled={!dragEnabled}
                reorderLabel={hint}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}


/**
 * Cabecera de banda del triaje (artboard 3a): cifra en display, nombre, y una
 * línea que dice **por qué importa** esa banda.
 *
 * Es plegable porque el plan pide que "durmiendo" y "lanzados" nazcan
 * colapsados — pero entonces plegar tiene que poder hacerse en todas, o sería
 * un botón que aparece solo en dos filas sin explicación. Y el contador va en
 * la cabecera precisamente para que **plegar no esconda nada**: sigues sabiendo
 * cuántos hay dentro.
 */
export function BandHeader({
  label,
  blurb,
  count,
  collapsed,
  onToggle,
}: {
  label: string;
  blurb: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      className="w-full text-left bg-surface px-5 pt-4 pb-2 flex items-baseline gap-3 hover:bg-line-04 transition-colors duration-150 ease-out group"
    >
      <span className="font-display-app text-2xl leading-none text-text tabular-nums">
        {count}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <ChevronRight
            size={12}
            className={`shrink-0 text-text-4 transition-transform duration-150 ease-out ${
              collapsed ? "" : "rotate-90"
            }`}
          />
          <Meta variant="cintillo" tone="muted">
            {label}
          </Meta>
        </span>
        {!collapsed && (
          <Meta tone="faint" className="block mt-0.5 pl-[18px]">
            {blurb}
          </Meta>
        )}
      </span>
    </button>
  );
}
