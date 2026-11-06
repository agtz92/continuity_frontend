"use client";

import { useMutation } from "@apollo/client";
import {
  ARCHIVE_ROUTINE,
  COMPLETE_ROUTINE_OCCURRENCE,
  CREATE_ROUTINE,
  DELETE_ROUTINE,
  UNCOMPLETE_ROUTINE_OCCURRENCE,
  UPDATE_ROUTINE,
} from "@/lib/graphql";
import type { IntervalUnit, RecurrenceType } from "@/lib/types";

import {
  fullRefetchAfter,
  insertAfter,
  removeAfter,
  syncAfter,
} from "@/lib/dashboardSync";

export interface RoutineFormInput {
  id?: string;
  title: string;
  description: string;
  recurrenceType: RecurrenceType;
  startDate: string;
  endDate: string | null;
  weekdays: number[];
  intervalN: number | null;
  intervalUnit: IntervalUnit | null;
  monthlyDay: number | null;
  effortHours: number | null;
  projectId: string | null;
  timeOfDay?: string | null;
  durationMinutes?: number | null;
}

export function useRoutineMutations() {
  const [createRoutine] = useMutation(CREATE_ROUTINE, insertAfter("routines", "createRoutine"));
  const [updateRoutine] = useMutation(UPDATE_ROUTINE, syncAfter);
  const [archiveRoutineM] = useMutation(ARCHIVE_ROUTINE, syncAfter);
  const [deleteRoutineM] = useMutation(DELETE_ROUTINE, fullRefetchAfter);
  const [completeOccurrenceM] = useMutation(
    COMPLETE_ROUTINE_OCCURRENCE,
    insertAfter("routineOccurrences", "completeRoutineOccurrence")
  );
  // Devuelve un booleano, no la ocurrencia: se saca de la caché por `id`.
  const [uncompleteOccurrenceM] = useMutation(
    UNCOMPLETE_ROUTINE_OCCURRENCE,
    removeAfter("routineOccurrences")
  );

  const saveRoutine = async (r: RoutineFormInput): Promise<boolean> => {
    const data = {
      title: r.title,
      description: r.description,
      recurrenceType: r.recurrenceType,
      startDate: r.startDate,
      endDate: r.endDate,
      weekdays: r.weekdays,
      intervalN: r.intervalN,
      intervalUnit: r.intervalUnit,
      monthlyDay: r.monthlyDay,
      effortHours: r.effortHours,
      projectId: r.projectId || null,
      timeOfDay: r.timeOfDay ?? null,
      durationMinutes: r.durationMinutes ?? null,
    };
    try {
      if (r.id) {
        await updateRoutine({ variables: { id: r.id, data } });
      } else {
        await createRoutine({ variables: { data } });
      }
      return true;
    } catch {
      return false;
    }
  };

  const archiveRoutine = async (id: string, archived: boolean): Promise<void> => {
    try {
      await archiveRoutineM({ variables: { id, archived } });
    } catch {
      /* errorLink already toasted */
    }
  };

  const deleteRoutine = async (id: string): Promise<void> => {
    try {
      await deleteRoutineM({ variables: { id } });
    } catch {
      /* errorLink already toasted */
    }
  };

  const completeOccurrence = async (
    routineId: string,
    scheduledDate: string
  ): Promise<void> => {
    try {
      await completeOccurrenceM({
        variables: { routineId, scheduledDate, note: "" },
      });
    } catch {
      /* errorLink already toasted */
    }
  };

  const uncompleteOccurrence = async (id: string): Promise<void> => {
    try {
      await uncompleteOccurrenceM({ variables: { id } });
    } catch {
      /* errorLink already toasted */
    }
  };

  return {
    saveRoutine,
    archiveRoutine,
    deleteRoutine,
    completeOccurrence,
    uncompleteOccurrence,
  };
}
