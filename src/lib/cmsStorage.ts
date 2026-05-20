"use client";

import { supabase } from "./supabase";

const BUCKET = "cms-media";

// Cover images for blog posts and help resources live in their own
// bucket so they can be managed independently of inline editor media.
const COVER_BUCKET = "blog";

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

/**
 * Upload a cover image to the Supabase `blog` bucket and return its
 * public URL. Used for the cover photo of blog posts and help
 * resources. The bucket must be public-read with an RLS policy that
 * allows authenticated uploads.
 */
export async function uploadCoverImage(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) {
    console.error("[cmsStorage] cover must be an image");
    return null;
  }

  const now = new Date();
  const folder = `covers/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const path = `${folder}/${now.getTime()}-${slugifyFilename(file.name)}`;

  const { error } = await supabase.storage
    .from(COVER_BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error) {
    console.error("[cmsStorage] cover upload error", error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
  return publicUrl;
}

function probeVideoDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const dims = { width: video.videoWidth, height: video.videoHeight };
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    video.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    video.src = url;
  });
}

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB cap for direct uploads

/**
 * Upload an image or video to the `cms-media` bucket. Mirrors
 * `uploadCmsImage` but also accepts videos, places them under a
 * `videos/` prefix, probes dimensions via the appropriate element,
 * and enforces a size cap for direct (browser) uploads.
 */
export async function uploadCmsMedia(file: File): Promise<{
  publicUrl: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
} | null> {
  const isVideo = file.type.startsWith("video/");
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    console.error("[cmsStorage] video exceeds 50MB cap");
    return null;
  }

  const now = new Date();
  const folder = `${isVideo ? "videos/" : ""}${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
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
  } else if (isVideo) {
    const probed = await probeVideoDimensions(file).catch(() => null);
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
