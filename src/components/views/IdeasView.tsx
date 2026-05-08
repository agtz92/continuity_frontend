"use client";

import { useState } from "react";
import { Edit2, Lightbulb, Plus, Search } from "lucide-react";
import type { Idea } from "@/lib/types";

export function IdeasView({
  ideas,
  onCapture,
  onEdit,
  onPromote,
  onDelete,
}: {
  ideas: Idea[];
  onCapture: () => void;
  onEdit: (idea: Idea) => void;
  onPromote: (id: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const [ideaSearch, setIdeaSearch] = useState("");

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">Ideas Parking Lot</h2>
        <div className="flex items-center gap-2 flex-1 sm:max-w-md sm:ml-auto">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
            <input
              type="text"
              value={ideaSearch}
              onChange={(e) => setIdeaSearch(e.target.value)}
              placeholder="Search ideas..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-zinc-600"
            />
          </div>
          <button
            onClick={onCapture}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 shrink-0"
          >
            <Plus size={16} /> Capture
          </button>
        </div>
      </div>
      <p className="text-sm text-zinc-500 mb-4">
        Park new ideas here so you don&apos;t abandon current projects. Promote them when you&apos;re ready.
      </p>
      {ideas.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-400">
          No ideas captured yet.
        </div>
      ) : (() => {
        const q = ideaSearch.trim().toLowerCase();
        const filteredIdeas = q
          ? ideas.filter(
              (i) =>
                i.title.toLowerCase().includes(q) ||
                i.description.toLowerCase().includes(q) ||
                i.why.toLowerCase().includes(q)
            )
          : ideas;

        if (filteredIdeas.length === 0) {
          return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-sm">
              No ideas match &ldquo;{ideaSearch}&rdquo;
            </div>
          );
        }

        return (
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredIdeas.map((i) => (
              <div
                key={i.id}
                className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4"
              >
                <div className="flex items-start gap-2 mb-2">
                  <Lightbulb className="text-purple-400 shrink-0 mt-0.5" size={16} />
                  <div className="font-semibold text-purple-100 flex-1 break-words">
                    {i.title}
                  </div>
                </div>
                {i.why && (
                  <div className="text-sm text-purple-200/80 italic mb-2 break-words">
                    → {i.why}
                  </div>
                )}
                {i.description && (
                  <div className="text-sm text-zinc-400 mb-3 break-words">
                    {i.description}
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => onPromote(i.id)}
                    className="text-xs px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded-md"
                  >
                    Promote to project
                  </button>
                  <button
                    onClick={() => onEdit(i)}
                    className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md flex items-center gap-1"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => onDelete(i.id)}
                    className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-md"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
