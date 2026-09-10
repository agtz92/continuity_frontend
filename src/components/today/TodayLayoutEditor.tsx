"use client";

import type { ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { TODAY_SECTIONS, type TodaySectionId } from "@/lib/todaySections";
import type { TodayColumn, UseTodayLayoutReturn } from "@/hooks/useTodayLayout";
import { Meta } from "@/components/ui/Meta";
import { TodaySection } from "./TodaySection";

/**
 * El editor de layout del Home, con **dos columnas de verdad**.
 *
 * Se arrastra cualquier sección a cualquier sitio: dentro de su columna, a la
 * otra columna, o a una columna vacía. No hay lista blanca de qué puede vivir
 * en el lateral — si el rediseño pone ahí "detenido" y "enfriándose" es porque
 * es el defecto sensato, no porque sea el único sitio donde caben.
 *
 * Cada columna es a la vez `SortableContext` (para ordenar dentro) y zona
 * `useDroppable` (para aceptar lo que viene de la otra, incluso estando vacía —
 * sin la zona, una columna vacía no tiene nada sobre lo que soltar).
 */

const ZONE_ID: Record<TodayColumn, string> = {
  main: "zone:main",
  rail: "zone:rail",
};

function Zone({
  column,
  label,
  hint,
  ids,
  children,
}: {
  column: TodayColumn;
  label: string;
  hint: string;
  ids: TodaySectionId[];
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: ZONE_ID[column] });

  return (
    <div className={column === "rail" ? "md:w-[300px] shrink-0" : "flex-1 min-w-0"}>
      <Meta variant="cintillo" tone="faint" className="block mb-1.5">
        {label}
      </Meta>
      <div
        ref={setNodeRef}
        className={`rounded-lg border border-dashed p-2 min-h-[88px] space-y-2 transition-colors duration-150 ease-out ${
          isOver ? "border-accent bg-accent-a12" : "border-line-22"
        }`}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
        {ids.length === 0 && (
          <Meta tone="faint" className="block px-2 py-4 text-center">
            {hint}
          </Meta>
        )}
      </div>
    </div>
  );
}

export function TodayLayoutEditor({
  layout,
  sectionIcon,
  labelOf,
  hideLabels,
  zoneLabels,
}: {
  layout: UseTodayLayoutReturn;
  sectionIcon: Record<TodaySectionId, ReactNode>;
  labelOf: (id: TodaySectionId) => string;
  hideLabels: { show: string; hide: string; locked: string; drag: string };
  zoneLabels: {
    main: string;
    rail: string;
    mainHint: string;
    railHint: string;
  };
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /**
   * Un solo `onDragEnd` para los dos gestos. `over` puede ser otra sección
   * (se inserta en su hueco) o la zona entera (se añade al final) — esto
   * último es lo que hace que se pueda soltar en una columna vacía.
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const id = active.id as TodaySectionId;
    const overId = String(over.id);

    if (overId === ZONE_ID.main || overId === ZONE_ID.rail) {
      const column: TodayColumn = overId === ZONE_ID.rail ? "rail" : "main";
      if (layout.columnOf(id) === column) return;
      const target = column === "rail" ? layout.rail : layout.order;
      layout.moveSection(id, column, target.length);
      return;
    }

    const overSection = overId as TodaySectionId;
    if (overSection === id) return;
    const column = layout.columnOf(overSection);
    const target = column === "rail" ? layout.rail : layout.order;
    layout.moveSection(id, column, target.indexOf(overSection));
  };

  const renderRow = (id: TodaySectionId) => {
    const meta = TODAY_SECTIONS.find((s) => s.id === id);
    if (!meta) return null;
    return (
      <TodaySection
        key={id}
        id={id}
        editMode
        hidden={layout.hidden.has(id)}
        hideable={meta.hideable}
        label={labelOf(id)}
        icon={sectionIcon[id]}
        onToggleHide={() => layout.toggleVisibility(id)}
        hideLabels={hideLabels}
      >
        {/* Children unused in edit mode but kept for type satisfaction. */}
        {null}
      </TodaySection>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <Zone
          column="main"
          label={zoneLabels.main}
          hint={zoneLabels.mainHint}
          ids={layout.order}
        >
          {layout.order.map(renderRow)}
        </Zone>
        <Zone
          column="rail"
          label={zoneLabels.rail}
          hint={zoneLabels.railHint}
          ids={layout.rail}
        >
          {layout.rail.map(renderRow)}
        </Zone>
      </div>
    </DndContext>
  );
}
