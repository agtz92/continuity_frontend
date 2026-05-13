"use client";

import { supabase } from "./supabase";

const BUCKET = "cms-media";

function slugifyFilename(name: string): string {
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  return (
    stem
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() + ext.toLowerCase()
  );
}

/**
 * Upload a file to the Supabase `cms-media` bucket and return the
 * public URL plus enough metadata to register the asset with our
 * backend (`adminMediaRegister`).
 *
 * Requires the bucket to be public and to have an RLS policy that
 * allows authenticated users with the admin claim to upload — admin
 * checks happen on the backend side; here we rely on the user's
 * session being attached to the request.
 */
export async function uploadCmsImage(file: File): Promise<{
  publicUrl: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
} | null> {
  const now = new Date();
  const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const path = `${folder}/${now.getTime()}-${slugifyFilename(file.name)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    console.error("[cmsStorage] upload error", error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  let width: number | undefined;
  let height: number | undefined;
  if (file.type.startsWith("image/")) {
    const probed = await probeImageDimensions(file).catch(() => null);
    if (probed) {
      width = probed.width;
      height = probed.height;
    }
  }

  return {
    publicUrl,
    storagePath: path,
    mimeType: file.type,
    sizeBytes: file.size,
    width,
    height,
  };
}

function probeImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
