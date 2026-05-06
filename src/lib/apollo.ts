"use client";

import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  from,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { supabase } from "./supabase";

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

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
});
