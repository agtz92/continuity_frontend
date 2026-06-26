import { gql } from "@apollo/client";

/**
 * Catálogo central de queries y mutations GraphQL de Apollo, escritas a mano con `gql`.
 * NO es código generado por codegen: cada documento (y cada selección de campos) se
 * mantiene manualmente, por lo que las field-lists deben quedar en sync con el schema
 * del backend (Strawberry) a mano.
 *
 * TODO: refactor — partir este archivo por dominio en
 * lib/graphql/{queries,mutations}/<dominio>.ts + fragments.ts (ver AUDITORIA_CODIGO.md)
 */

// ===== Core / sesión =====
export const ME_QUERY = gql`
  query Me {
    me {
      userId
      isAdmin
    }
  }
`;

// ===== MCP: conexiones del usuario =====

export const MCP_CONNECTIONS_QUERY = gql`
  query McpConnections {
    mcpConnections {
      clientId
      clientName
      connectedAt
    }
  }
`;


export const REVOKE_MCP_CONNECTION = gql`
  mutation RevokeMcpConnection($clientId: ID!) {
    revokeMcpConnection(clientId: $clientId)
  }
`;

// ===== Admin: MCP =====
