"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AssistantToolUseBlock } from "@/hooks/useAssistant";

const READABLE_NAME: Record<string, string> = {
  get_dashboard_summary: "Dashboard summary",
  list_projects: "List projects",
  get_project_detail: "Project detail",
  list_tasks: "List tasks",
  list_ideas: "List ideas",
  list_categories: "List categories",
  get_analytics: "Analytics",
  search: "Search",
};

function ProjectsList({ output }: { output: unknown }) {
  const projects = (output as { projects?: Array<Record<string, unknown>> })
    ?.projects;
  if (!Array.isArray(projects) || projects.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {projects.slice(0, 8).map((p, i) => (
        <li
          key={(p.id as string) || i}
          className="flex items-center justify-between gap-2 text-xs px-2 py-1.5 rounded bg-surface/60 border border-border"
        >
          <span className="truncate text-text">{String(p.name || "")}</span>
          <span className="shrink-0 text-[10px] text-text-muted uppercase tracking-wide">
            {String(p.status || "")}
          </span>
        </li>
      ))}
    </ul>
  );
}

function TasksList({ output }: { output: unknown }) {
  const tasks = (output as { tasks?: Array<Record<string, unknown>> })?.tasks;
  if (!Array.isArray(tasks) || tasks.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {tasks.slice(0, 8).map((t, i) => (
        <li
          key={(t.id as string) || i}
          className="flex items-center gap-2 text-xs px-2 py-1.5 rounded bg-surface/60 border border-border"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              t.done ? "bg-text-muted" : "bg-accent"
            }`}
          />
          <span
            className={`truncate ${
              t.done ? "text-text-muted line-through" : "text-text"
            }`}
          >
            {String(t.title || "")}
          </span>
        </li>
      ))}
    </ul>
  );
}

const RICH_RENDERERS: Record<
  string,
  (props: { output: unknown }) => ReactNode
> = {
  list_projects: ProjectsList,
  list_tasks: TasksList,
};

export function ToolCallCard({ block }: { block: AssistantToolUseBlock }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("assistant.tools");
  const name = READABLE_NAME[block.name] || block.name;
  const RichRenderer = RICH_RENDERERS[block.name];
  const isLoading = block.output === undefined;

  return (
    <div className="my-2 rounded-lg border border-border bg-surface/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-text-muted hover:bg-surface/80 transition-colors"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Wrench size={12} className="text-text-muted" />
        <span className="font-medium">{name}</span>
        {isLoading ? (
          <span className="ml-auto text-[10px] text-accent animate-pulse">
            {t("running")}
          </span>
        ) : (
          <span className="ml-auto text-[10px] text-text-muted">
            {t("done")}
          </span>
        )}
      </button>
      {open && (
        <div className="px-3 py-2 border-t border-border bg-bg/40">
          {Object.keys(block.input).length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
                {t("input")}
              </div>
              <pre className="text-[11px] text-text-muted whitespace-pre-wrap break-words">
                {JSON.stringify(block.input, null, 2)}
              </pre>
            </div>
          )}
          {!isLoading && (
            <>
              {RichRenderer ? (
                <RichRenderer output={block.output} />
              ) : (
                <pre className="text-[11px] text-text-muted whitespace-pre-wrap break-words max-h-48 overflow-auto">
                  {JSON.stringify(block.output, null, 2)}
                </pre>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
