"use client";

import { ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import type { Project } from "@/lib/types";

/**
 * Read-only render of a project's closure notes. Used in the WelcomeBackCard
 * (paused notes) and the project detail view, and in the GraveyardView card
 * (killed notes + AI reflection). Brand voice: plain, no em-dashes.
 */
export function ProjectClosureNotes({ project: p }: { project: Project }) {
  if (p.status === "paused") {
    return (
      <div className="space-y-3 text-sm">
        <NoteRow label="Where you stopped" value={p.pausedContext} />
        {p.pausedNextAction ? (
          <div>
            <div className="text-xs uppercase tracking-wider text-text-muted mb-1">
              Your next action was
            </div>
            <div className="flex items-start gap-1.5 text-text">
              <ArrowRight size={14} className="mt-0.5 shrink-0 text-accent" />
              <span>{p.pausedNextAction}</span>
            </div>
          </div>
        ) : null}
        {p.pausedBlocker ? (
          <NoteRow label="What was blocking you" value={p.pausedBlocker} />
        ) : null}
      </div>
    );
  }

  if (p.status === "killed") {
    return (
      <div className="space-y-3 text-sm">
        <NoteRow label="Why it was killed" value={p.killedReason} />
        <NoteRow label="What it taught" value={p.killedLearnings} />
        {p.killedWouldRestart ? (
          <div>
            <div className="text-xs uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1">
              <RefreshCw size={11} /> Would restart
            </div>
            <div className="text-text">{p.killedWouldRestart}</div>
          </div>
        ) : null}
        {p.killedAiReflection ? (
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
            <div className="text-xs uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1">
              <Sparkles size={11} /> AI
            </div>
            <div className="text-text-muted whitespace-pre-wrap">
              {p.killedAiReflection}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}

function NoteRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-text-muted mb-1">
        {label}
      </div>
      <div className="text-text whitespace-pre-wrap">{value}</div>
    </div>
  );
}
