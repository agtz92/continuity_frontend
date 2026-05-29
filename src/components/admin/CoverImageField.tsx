"use client";

import { useState } from "react";
import { uploadCoverImage } from "@/lib/cmsStorage";
import { toast } from "@/lib/toast";
import { MediaPickerModal } from "./MediaPickerModal";

/**
 * Cover-image picker used by blog posts, pages and help resources. Accepts a
 * pasted URL, a fresh upload (routed through the WebP compressor in
 * `uploadCoverImage`), or reusing an image already in the buckets via the
 * library modal — the latter avoids re-uploading duplicates across locale
 * twins (e.g. ES + EN versions of the same post).
 */
export function CoverImageField({
  value,
  onChange,
  uploadErrorMessage = "Error al subir la imagen",
}: {
  value: string;
  onChange: (url: string) => void;
  uploadErrorMessage?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const url = await uploadCoverImage(file);
    setUploading(false);
    if (!url) {
      toast.error(uploadErrorMessage);
      return;
    }
    onChange(url);
  };

  return (
    <>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://… o sube/elige una imagen"
        className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text outline-none focus:border-accent"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label
          className={`cursor-pointer rounded border border-border bg-bg px-2 py-1 text-xs text-text hover:bg-surface ${
            uploading ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {uploading ? "Subiendo…" : "Subir imagen"}
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
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="rounded border border-border bg-bg px-2 py-1 text-xs text-text hover:bg-surface"
        >
          Elegir de la biblioteca
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-text-muted hover:underline"
          >
            Quitar
          </button>
        )}
      </div>
      {value && (
        <img
          src={value}
          alt="cover"
          className="mt-2 max-h-32 rounded border border-border object-cover"
        />
      )}
      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        defaultBucket="blog"
        onSelect={(url) => {
          onChange(url);
          setPickerOpen(false);
        }}
      />
    </>
  );
}
