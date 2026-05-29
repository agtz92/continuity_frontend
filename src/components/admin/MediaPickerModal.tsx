"use client";

import { useEffect, useMemo, useState } from "react";
import { listBucketFiles } from "@/lib/cmsStorage";
import type { StorageFile } from "@/lib/cmsStorage";

type Bucket = "blog" | "cms-media";

const BUCKETS: { id: Bucket; label: string }[] = [
  { id: "blog", label: "Portadas (blog)" },
  { id: "cms-media", label: "Editor (cms-media)" },
];

function isImage(mime: string, path: string): boolean {
  if (mime.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(path);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Modal that browses the Supabase Storage buckets and resolves to a public
 * URL on click. Lets an editor reuse an image that's already uploaded
 * (e.g. the cover of the Spanish post when creating its English twin)
 * instead of uploading a duplicate. Reads buckets directly via
 * `listBucketFiles` rather than the MediaAsset registry, because cover
 * images are not registered there.
 */
export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  defaultBucket = "blog",
  onUpload,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  defaultBucket?: Bucket;
  /**
   * When provided, the modal shows a "Subir nueva" button. The handler
   * should upload the file and return its public URL (or null on failure);
   * the modal then selects it just like an existing image.
   */
  onUpload?: (file: File) => Promise<string | null>;
}) {
  const [bucket, setBucket] = useState<Bucket>(defaultBucket);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (!onUpload) return;
    setUploading(true);
    const url = await onUpload(file);
    setUploading(false);
    if (url) onSelect(url);
  };

  useEffect(() => {
    if (open) setBucket(defaultBucket);
  }, [open, defaultBucket]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    listBucketFiles(bucket).then((result) => {
      if (cancelled) return;
      setFiles(result.filter((f) => isImage(f.mimeType, f.path)));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, bucket, reloadKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.path.toLowerCase().includes(q));
  }, [files, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-text">
            Elegir de la biblioteca
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-text-muted hover:text-text"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
          <div className="flex gap-1">
            {BUCKETS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBucket(b.id)}
                className={`rounded px-2 py-1 text-xs font-medium ${
                  bucket === b.id
                    ? "bg-accent text-bg"
                    : "border border-border text-text-muted hover:text-text"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre…"
            className="ml-auto w-48 rounded border border-border bg-bg px-2 py-1 text-sm text-text outline-none focus:border-accent"
          />
          {onUpload && (
            <label
              className={`cursor-pointer rounded bg-accent px-2 py-1 text-xs font-medium text-bg hover:opacity-90 ${
                uploading ? "pointer-events-none opacity-50" : ""
              }`}
            >
              {uploading ? "Subiendo…" : "Subir nueva"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  e.target.value = "";
                }}
              />
            </label>
          )}
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded border border-border bg-bg px-2 py-1 text-xs text-text hover:bg-surface"
          >
            Refrescar
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 overflow-y-auto p-4 sm:grid-cols-4 md:grid-cols-5">
          {loading && (
            <div className="col-span-full py-8 text-center text-text-muted">
              Cargando…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="col-span-full py-8 text-center text-text-muted">
              {query
                ? "Sin resultados para esa búsqueda."
                : "El bucket está vacío o no es accesible (revisa la política RLS de lectura)."}
            </div>
          )}
          {!loading &&
            filtered.map((f) => (
              <button
                key={f.path}
                type="button"
                onClick={() => onSelect(f.publicUrl)}
                title={f.path}
                className="group overflow-hidden rounded-lg border border-border bg-bg text-left transition-colors hover:border-accent"
              >
                <div className="aspect-square">
                  <img
                    src={f.publicUrl}
                    alt={f.path}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-0.5 p-1.5 text-[11px]">
                  <div className="truncate text-text">
                    {f.path.split("/").pop()}
                  </div>
                  <div className="text-text-muted">{formatSize(f.sizeBytes)}</div>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
