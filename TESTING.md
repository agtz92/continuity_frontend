# Frontend testing guide

Tests for the Next.js + Apollo frontend, using Vitest + Testing Library + Apollo's `MockedProvider`. Designed to be **fully isolated from your dev environment**: jsdom (no real browser), Supabase mocked globally, no real network calls.

## Install

```bash
cd frontend
pnpm install
```

This pulls `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event` from `devDependencies`.

## Run

```bash
pnpm test                # watch mode (re-runs on file change)
pnpm test:run            # one-shot, suitable for CI
pnpm test:coverage       # one-shot with coverage report
pnpm test src/lib        # filter by path
pnpm test -t "errorLink" # filter by test name
```

## How isolation works

* **`vitest.config.ts`** sets the test env to `jsdom`, so React renders into a simulated DOM in-process. No browser, no dev server, no Next.js build.
* **`vitest.setup.ts`** runs before every test file:
  * Mocks `@/lib/supabase` globally — no test can ever hit the real Supabase client.
  * Resets the toast module's internal state (`__resetToastsForTests`) in `beforeEach` so module-level state doesn't leak between tests.
  * Auto-confirms `window.confirm` so destructive-action tests don't hang.
* Apollo network calls use either `MockedProvider` (component tests) or a custom mock `ApolloLink` (errorLink tests). **No real GraphQL request ever leaves the process.**
* `cleanup()` is called after every test to unmount React trees.

## File-by-file

### `src/lib/toast.test.ts` — the toast bus
* `pushes a toast and notifies subscribers` — `toast.error()` triggers all subscribers with the new array.
* `supports success and info kinds` — kind is preserved on the emitted toast.
* `dismisses by id` — `toast.dismiss(id)` removes only the matching toast.
* `auto-dismisses after the TTL` — uses fake timers to verify the auto-dismiss timeout fires.
* `stops calling unsubscribed listeners` — the unsubscribe function returned by `subscribeToasts` actually unsubscribes.

### `src/components/Toaster.test.tsx` — the visual layer
* `renders nothing when there are no toasts` — empty bus = no DOM.
* `renders an error toast pushed via the bus` — error toasts have `role="alert"` (announced by screen readers).
* `renders success toasts as status (not alert)` — non-errors use `role="status"` to avoid being too noisy.
* `dismisses a toast when the close button is clicked` — clicking the × removes the toast.
* `stacks multiple toasts in order` — multiple `toast.error()` calls render multiple alerts.

### `src/lib/apollo.test.ts` — the `errorLink` (centerpiece of error UX)
The link is exported as `createErrorLink({ onAuthFailure })` so we can inject a fake auth-failure handler instead of triggering a real Supabase sign-out. Each test composes the link with a mock terminating link that emits a controlled response.
* `toasts the GraphQL error message` — a `NOT_FOUND` GraphQL error becomes an error toast with the original message.
* `calls onAuthFailure when the error code is UNAUTHENTICATED` — emits a "session expired" toast AND triggers the auth-failure callback (which in production signs the user out).
* `treats a 401 networkError as an auth failure` — same handling as `UNAUTHENTICATED`.
* `toasts a generic message for non-401 network errors and includes the operation name` — verifies the message format the user sees on backend down / no internet.
* `does not toast on success` — successful responses don't generate toasts.
* `emits one toast per GraphQL error in a multi-error response` — every error in the array gets surfaced.

### `src/components/Dashboard.error.test.tsx` — end-to-end mutation behavior
Renders `<Dashboard />` inside `MockedProvider`, navigates to the Ideas tab, opens the Capture Idea modal, types a title, and submits.
* `keeps the Capture Idea modal open when createIdea fails` — the mutation mock returns a GraphQLError; the modal title "Capture Idea" must remain visible after the mutation settles. **This pins the `try/catch` behavior added in `Dashboard.tsx`.**
* `closes the Capture Idea modal when createIdea succeeds` — the success path closes the modal as expected, providing a positive control for the negative test above.

> Note: toast emission is **not** verified through the Dashboard test because `MockedProvider` short-circuits the Apollo link chain and bypasses `errorLink`. Toast behavior is covered in `apollo.test.ts`.

## CI snippet

```yaml
frontend:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with: { version: 9 }
    - uses: actions/setup-node@v4
      with: { node-version: "20", cache: pnpm, cache-dependency-path: pnpm-lock.yaml }
    - run: pnpm install
    - run: pnpm test:run
```

## What is NOT tested (yet)

* **End-to-end through a real browser.** No Playwright. The integration tests use jsdom + mocked Apollo, which catches ~95% of regressions for ~10% of the cost. If you start hitting issues with browser-only behavior (focus, keyboard, layout), introduce Playwright then — not before.
* **The HTTP layer between frontend and backend.** Frontend tests stop at the Apollo link; the backend has its own suite (see `../backend/TESTING.md`). The contract (operation names, variable shapes, error codes) is what both suites pin. If you change a mutation signature, both sides should fail.
