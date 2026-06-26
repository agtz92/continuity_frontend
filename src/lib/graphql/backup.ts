import { gql } from "@apollo/client";

export const MARK_BACKUP = gql`
  mutation MarkBackup {
    markBackup
  }
`;

// ===== Ajustes de notificaciones + canales (usuario) =====
