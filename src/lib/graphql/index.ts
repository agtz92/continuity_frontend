/**
 * Catálogo central de queries y mutations GraphQL de Apollo, escritas a mano con `gql`.
 * NO es código generado por codegen: las field-lists se mantienen en sync con el
 * schema del backend (Strawberry) a mano. Dividido por dominio (ver AUDITORIA_CODIGO.md);
 * este barrel re-exporta todo para que los imports `@/lib/graphql` sigan funcionando.
 */
export * from "./fragments";
export * from "./activity";
export * from "./admin";
export * from "./analytics";
export * from "./announcements";
export * from "./backup";
export * from "./billing";
export * from "./cms";
export * from "./dashboard";
export * from "./feedback";
export * from "./ideas";
export * from "./integrations";
export * from "./notifications";
export * from "./profile";
export * from "./projects";
export * from "./quick-notes";
export * from "./routines";
export * from "./session";
export * from "./tasks";
