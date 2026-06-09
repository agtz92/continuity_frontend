// Source of truth for the bug-report topic list (web).
//
// IMPORTANT: keep these `value`s in sync with the mobile mirror at
// `continuity-mobile/src/lib/bugTopics.ts`. The backend stores `topic` as plain
// text (the value here, or a user's free-typed text), so the values must match
// across platforms for consistent admin filtering/reading.
//
// Labels are resolved via i18n: messages key `bugTopics.<value>`.

export const BUG_TOPIC_VALUES = [
  "crash",
  "performance",
  "ui",
  "sync",
  "notifications",
  "account",
  "billing",
  "other",
] as const;

export type BugTopicValue = (typeof BUG_TOPIC_VALUES)[number];
