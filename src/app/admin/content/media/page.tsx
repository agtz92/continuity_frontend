"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  ADMIN_MEDIA_ASSETS_QUERY,
  ADMIN_MEDIA_DELETE,
  ADMIN_MEDIA_REGISTER,
} from "@/lib/graphql";
import { uploadCmsMedia } from "@/lib/cmsStorage";
import { toast } from "@/lib/toast";

type Asset = {
  id: string;
  storagePath: string;
  publicUrl: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
};

type Data = {
  adminMediaAssets: {
    assets: Asset[];
    page: number;
    perPage: number;
    hasNext: boolean;
  };
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const [page, setPage] = useState(1);
  const { data, loading, refetch } = useQuery<Data>(ADMIN_MEDIA_ASSETS_QUERY, {
    variables: { page, perPage: 36 },
    fetchPolicy: "cache-and-network",
  });

  const [registerMedia, { loading: uploading }] = useMutation(
    ADMIN_MEDIA_REGISTER
  );
  const [del] = useMutation(ADMIN_MEDIA_DELETE, {
    onCompleted: () => {
      toast.success("Eliminado del registro");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      const uploaded = await uploadCmsMedia(file);
      if (!uploaded) {
        toast.error(`Error subiendo ${file.name}`);
        continue;
      }
      try {
        await registerMedia({
          variables: {
            data: {
              storagePath: uploaded.storagePath,
              publicUrl: uploaded.publicUrl,
              originalFilename: file.name,
              mimeType: uploaded.mimeType,
              sizeBytes: uploaded.sizeBytes,
              width: uploaded.width ?? null,
              height: uploaded.height ?? null,
            },
          },
        });
      } catch (e) {
        toast.error(`Subió pero falló al registrar: ${file.name}`);
      }
    }
    refetch();
  };

  const assets = data?.adminMediaAssets.assets ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Biblioteca de medios</h1>
          <p className="mt-1 text-sm text-text-muted">
            Imágenes y archivos subidos al bucket cms-media.
          </p>
        </div>
        <label className="cursor-pointer rounded bg-accent px-3 py-1.5 text-sm font-medium text-bg hover:opacity-90">
          {uploading ? "Subiendo…" : "Subir archivos"}
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {loading && assets.length === 0 && (
          <div className="col-span-full text-center text-text-muted">Cargando…</div>
        )}
        {!loading && assets.length === 0 && (
          <div className="col-span-full text-center text-text-muted">
            Aún no hay archivos. Sube algo para empezar.
          </div>
        )}
        {assets.map((a) => (
          <div
            key={a.id}
            className="group overflow-hidden rounded-lg border border-border bg-surface"
          >
            <div className="aspect-square bg-bg/40">
              {a.mimeType.startsWith("image/") ? (
                <img
                  src={a.publicUrl}
                  alt={a.originalFilename}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : a.mimeType.startsWith("video/") ? (
                <video
                  src={a.publicUrl}
                  preload="metadata"
                  muted
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-text-muted">
                  {a.mimeType || "archivo"}
                </div>
              )}
            </div>
            <div className="space-y-1 p-2 text-xs">
              <div className="truncate text-text" title={a.originalFilename}>
                {a.originalFilename || a.storagePath}
              </div>
              <div className="flex items-center justify-between text-text-muted">
                <span>{formatSize(a.sizeBytes)}</span>
                {a.width && a.height && (
                  <span>
                    {a.width}×{a.height}
                  </span>
                )}
              </div>
              <div className="flex justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(a.publicUrl);
                    toast.success("URL copiada");
                  }}
                  className="text-accent hover:underline"
                >
                  Copiar URL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm("¿Eliminar del registro? El archivo en Supabase Storage permanece.")) return;
                    del({ variables: { id: a.id } });
                  }}
                  className="text-red-400 hover:underline"
                >
                  Borrar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-text-muted">
        <div>Página {data?.adminMediaAssets.page ?? page}</div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-border px-3 py-1 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={!data?.adminMediaAssets.hasNext || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-border px-3 py-1 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
