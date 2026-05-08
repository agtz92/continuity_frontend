/**
 * Tests for the GraphQL `errorLink`.
 *
 * The link is the centerpiece of frontend error handling. We feed it
 * canned downstream responses (GraphQL errors, network errors) and
 * verify it (a) toasts the right message and (b) calls `onAuthFailure`
 * when the error is an auth failure.
 *
 * The test invokes the link via Apollo's `execute()` helper rather than
 * a real `ApolloClient`, so there's no network and no React.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ApolloLink,
  Observable,
  execute,
  gql,
  type FetchResult,
  type Operation,
} from "@apollo/client";
import { GraphQLError } from "graphql";
import { createErrorLink } from "./apollo";
import { subscribeToasts, type Toast } from "./toast";

const PING = gql`
  query Ping {
    ping
  }
`;

const collect = async (link: ApolloLink, query = PING): Promise<FetchResult> =>
  new Promise((resolve, reject) => {
    execute(link, { query }).subscribe({
      next: resolve,
      error: reject,
    });
  });

let captured: Toast[] = [];

beforeEach(() => {
  captured = [];
  subscribeToasts((t) => {
    captured = t;
  });
});

const lastToast = () => captured[captured.length - 1];

describe("createErrorLink", () => {
  it("toasts the GraphQL error message", async () => {
    const onAuthFailure = vi.fn();
    const errorLink = createErrorLink({ onAuthFailure });
    const downstream = new ApolloLink(
      () =>
        new Observable<FetchResult>((obs) => {
          obs.next({
            errors: [new GraphQLError("Project not found", {
              extensions: { code: "NOT_FOUND" },
            })],
          });
          obs.complete();
        })
    );

    await collect(ApolloLink.from([errorLink, downstream]));

    expect(captured).toHaveLength(1);
    expect(lastToast()).toMatchObject({
      kind: "error",
      message: "Project not found",
    });
    expect(onAuthFailure).not.toHaveBeenCalled();
  });

  it("calls onAuthFailure when the error code is UNAUTHENTICATED", async () => {
    const onAuthFailure = vi.fn();
    const errorLink = createErrorLink({ onAuthFailure });
    const downstream = new ApolloLink(
      () =>
        new Observable<FetchResult>((obs) => {
          obs.next({
            errors: [
              new GraphQLError("Not authenticated", {
                extensions: { code: "UNAUTHENTICATED" },
              }),
            ],
          });
          obs.complete();
        })
    );

    await collect(ApolloLink.from([errorLink, downstream]));

    expect(onAuthFailure).toHaveBeenCalledTimes(1);
    expect(lastToast()?.message).toMatch(/session expired/i);
  });

  it("treats a 401 networkError as an auth failure", async () => {
    const onAuthFailure = vi.fn();
    const errorLink = createErrorLink({ onAuthFailure });
    const downstream = new ApolloLink(
      () =>
        new Observable<FetchResult>((obs) => {
          const err = new Error("Unauthorized") as Error & { statusCode: number };
          err.statusCode = 401;
          obs.error(err);
        })
    );

    // The error propagates; the link still runs first.
    await collect(ApolloLink.from([errorLink, downstream])).catch(() => {});

    expect(onAuthFailure).toHaveBeenCalledTimes(1);
    expect(lastToast()?.message).toMatch(/session expired/i);
  });

  it("toasts a generic message for non-401 network errors and includes the operation name", async () => {
    const onAuthFailure = vi.fn();
    const errorLink = createErrorLink({ onAuthFailure });
    const downstream = new ApolloLink(
      () =>
        new Observable<FetchResult>((obs) => {
          obs.error(new Error("ECONNREFUSED"));
        })
    );

    await collect(ApolloLink.from([errorLink, downstream])).catch(() => {});

    expect(onAuthFailure).not.toHaveBeenCalled();
    expect(lastToast()?.kind).toBe("error");
    expect(lastToast()?.message).toMatch(/ECONNREFUSED/);
    // Operation name is "Ping" (from the gql tag).
    expect(lastToast()?.message).toMatch(/Ping/);
  });

  it("does not toast on success", async () => {
    const onAuthFailure = vi.fn();
    const errorLink = createErrorLink({ onAuthFailure });
    const downstream = new ApolloLink(
      () =>
        new Observable<FetchResult>((obs) => {
          obs.next({ data: { ping: "pong" } });
          obs.complete();
        })
    );

    const result = await collect(ApolloLink.from([errorLink, downstream]));
    expect(result.data).toEqual({ ping: "pong" });
    expect(captured).toHaveLength(0);
  });

  it("emits one toast per GraphQL error in a multi-error response", async () => {
    const onAuthFailure = vi.fn();
    const errorLink = createErrorLink({ onAuthFailure });
    const downstream = new ApolloLink(
      () =>
        new Observable<FetchResult>((obs) => {
          obs.next({
            errors: [
              new GraphQLError("first"),
              new GraphQLError("second"),
            ],
          });
          obs.complete();
        })
    );

    await collect(ApolloLink.from([errorLink, downstream]));
    expect(captured.map((t) => t.message)).toEqual(["first", "second"]);
  });
});

// Force the unused import to compile-check the Operation type.
export type _Unused = Operation;
