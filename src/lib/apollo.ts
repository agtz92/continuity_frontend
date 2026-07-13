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

// `X-Continuity-Client` lets the backend attribute interactions to a channel
// (web vs mobile) for admin metrics. Bucketing only — never used for authz.
const httpLink = new HttpLink({
  uri: graphqlUrl,
  headers: { "X-Continuity-Client": "web" },
});

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
  onError(({ graphQLErrors, networkError }) => {
    // All user-facing copy is localized: the link emits i18n keys (resolved by
    // the Toaster at render time), never raw English. `DB_UNAVAILABLE` and a
    // stale-connection hiccup (a tab left open for days, surfacing as "server
    // closed the connection unexpectedly") are treated as transient/retryable
    // and, critically, do NOT sign the user out. The backend also masks the raw
    // psycopg text behind the `DB_UNAVAILABLE` code (see core/auth.py).
    if (graphQLErrors && graphQLErrors.length > 0) {
      for (const err of graphQLErrors) {
        const code = (err.extensions as { code?: string } | undefined)?.code;
        if (code === "UNAUTHENTICATED") {
          toast.errorKey("errors.unauthenticated");
          deps.onAuthFailure();
          continue;
        }
        if (code === "DB_UNAVAILABLE") {
          toast.errorKey("errors.connectionLost");
          continue;
        }
        // App-level errors carry a human message from the backend; show it, or
        // fall back to a localized generic if absent.
        if (err.message) {
          toast.error(err.message);
        } else {
          toast.errorKey("errors.generic");
        }
      }
      return;
    }

    if (networkError) {
      const status = (networkError as { statusCode?: number }).statusCode;
      if (status === 401) {
        toast.errorKey("errors.unauthenticated");
        deps.onAuthFailure();
        return;
      }
      // Any other network failure — no status (offline / DNS / connection reset)
      // or a 5xx from the backend — is transient. Show the localized retry
      // message instead of leaking a raw fetch/proxy string.
      toast.errorKey("errors.connectionLost");
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
