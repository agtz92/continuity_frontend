"use client";

import { useState } from "react";
import { parseEmbedUrl } from "./VideoNode";

type EmbedModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    src: string;
    provider: "youtube" | "vimeo";
    caption: string;
  }) => void;
};

export function EmbedModal({ open, onClose, onSubmit }: EmbedModalProps) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = parseEmbedUrl(url);
    if (!parsed) {
      setError("URL no válida. Se aceptan enlaces de YouTube o Vimeo.");
      return;
    }
    onSubmit({ src: parsed.src, provider: parsed.provider, caption });
    setUrl("");
    setCaption("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-border bg-surface p-4 shadow-lg"
      >
        <h2 className="mb-3 text-sm font-semibold text-text">Insertar video</h2>
        <label className="mb-1 block text-xs text-text-muted">URL (YouTube o Vimeo)</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          autoFocus
          placeholder="https://www.youtube.com/watch?v=…"
          className="mb-3 w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
        <label className="mb-1 block text-xs text-text-muted">Caption (opcional)</label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="mb-3 w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1.5 text-xs text-text-muted hover:bg-bg hover:text-text"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            Insertar
          </button>
        </div>
      </form>
    </div>
  );
}
