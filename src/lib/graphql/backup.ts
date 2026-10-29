import { gql } from "@apollo/client";

export const MARK_BACKUP = gql`
  mutation MarkBackup {
    markBackup
  }
`;

// Restaura en el servidor, en una transacción (todo o nada).
// `mode`: "merge" | "replace". Ver backend/core/services/backup_restore.py.
export const RESTORE_BACKUP = gql`
  mutation RestoreBackup($data: String!, $mode: String!) {
    restoreBackup(data: $data, mode: $mode) {
      projects
      tasks
      routines
      ideas
      quickNotes
      activity
    }
  }
`;

// ===== Ajustes de notificaciones + canales (usuario) =====
