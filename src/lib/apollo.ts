"use client";

import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  from,
  type ApolloLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { supabase } from "./supabase";
import { toast } from "./toast";

const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const graphqlUrl =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ||
  (isLocal
    ? "http://localhost:8000/graphql/"
    : "https://continuity-backend.onrender.com/graphql/");

const httpLink = new HttpLink({ uri: graphqlUrl });

const authLink = setContext(async (_, { headers }) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    headers: {
      ...headers,
      ...(session?.access_token
        ? { authorization: `Bearer ${session.access_token}` }
        : {}),
    },
  };
});

/**
 * Build the global GraphQL error link.
 *
 * Exported as a factory (rather than a singleton) so tests can inject a
 * deterministic `onAuthFailure` handler instead of triggering a real
 * Supabase sign-out.
 */
export const createErrorLink = (deps: {
  onAuthFailure: () => void;
}): ApolloLink =>
  onError(({ graphQLErrors, networkError, operation }) => {
    const opName = operation.operationName || "request";

    if (graphQLErrors && graphQLErrors.length > 0) {
      for (const err of graphQLErrors) {
        const code = (err.extensions as { code?: string } | undefined)?.code;
        if (code === "UNAUTHENTICATED") {
          toast.error("Your session expired. Please sign in again.");
          deps.onAuthFailure();
          continue;
        }
        toast.error(err.message || `Server error during ${opName}.`);
      }
      return;
    }

    if (networkError) {
      const status = (networkError as { statusCode?: number }).statusCode;
      if (status === 401) {
        toast.error("Your session expired. Please sign in again.");
        deps.onAuthFailure();
        return;
      }
      const reason =
        (networkError as { message?: string }).message || "connection failed";
      toast.error(`Could not reach server (${opName}): ${reason}`);
    }
  });

const errorLink = createErrorLink({
  onAuthFailure: () => {
    supabase.auth.signOut().catch(() => {});
  },
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { errorPolicy: "all" },
    query: { errorPolicy: "all" },
  },
});
