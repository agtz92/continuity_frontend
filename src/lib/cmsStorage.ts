"use client";

import { supabase } from "./supabase";

const BUCKET = "cms-media";

// Cover images for blog posts and help resources live in their own
// bucket so they can be managed independently of inline editor media.
const COVER_BUCKET = "blog";

// Browser-side compression: every image that goes into Supabase Storage is
// re-encoded as WebP before upload. Avatars are a closed catalog uploaded
// separately by the backfill script — these helpers handle everything the
// admin UI sends (cover images, inline editor media).
const COMPRESSIBLE_MIME = /^image\/(jpeg|jpg|png|webp)$/i;
const COMPRESS_QUALITY = 0.8;
const COMPRESS_MAX_WIDTH = 1920;

function swapExt(name: string, newExt: string): string {
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  return stem + newExt;
}

/**
 * Re-encode an image as WebP, capping width at `maxWidth`. Returns the
 * original File untouched if the MIME is not a compressible raster
 * (videos, GIFs, SVGs), if the browser fails to decode it, or if
 * compression would have grown the file. EXIF orientation is honored.
 */
async function compressImageToWebp(
  file: File,
  opts?: { maxWidth?: number; quality?: number }
): Promise<File> {
  if (!COMPRESSIBLE_MIME.test(file.type)) return file;

  const maxWidth = opts?.maxWidth ?? COMPRESS_MAX_WIDTH;
  const quality = opts?.quality ?? COMPRESS_QUALITY;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (err) {
    console.warn("[cmsStorage] compress: decode failed, uploading original", err);
    return file;
  }

  const ratio = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));

  let blob: Blob | null = null;
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    blob = await canvas.convertToBlob({ type: "image/webp", quality });
  } else {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    );
  }

  if (!blob || blob.size >= file.size) return file;

  return new File([blob], swapExt(file.name, ".webp"), {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

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
  const compressed = await compressImageToWebp(file);

  const now = new Date();
  const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const path = `${folder}/${now.getTime()}-${slugifyFilename(compressed.name)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
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
  if (compressed.type.startsWith("image/")) {
    const probed = await probeImageDimensions(compressed).catch(() => null);
    if (probed) {
      width = probed.width;
      height = probed.height;
    }
  }

  return {
    publicUrl,
    storagePath: path,
    mimeType: compressed.type,
    sizeBytes: compressed.size,
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

  const compressed = await compressImageToWebp(file);

  const now = new Date();
  const folder = `covers/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const path = `${folder}/${now.getTime()}-${slugifyFilename(compressed.name)}`;

  const { error } = await supabase.storage
    .from(COVER_BUCKET)
    .upload(path, compressed, { cacheControl: "31536000", upsert: false });
  if (error) {
    console.error("[cmsStorage] cover upload error", error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
  return publicUrl;
}

export type StorageFile = {
  path: string;
  publicUrl: string;
  sizeBytes: number;
  mimeType: string;
  updatedAt: string | null;
};

/**
 * Recursively list every file in a Supabase Storage bucket and resolve
 * each one to its public URL. Walks nested folders (Supabase's `list`
 * is one level deep; folder entries have a null `id`). Requires a
 * `select` RLS policy on the bucket for the current session.
 */
export async function listBucketFiles(
  bucket: string,
  prefix = ""
): Promise<StorageFile[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });
  if (error || !data) {
    console.error("[cmsStorage] list error", bucket, prefix, error);
    return [];
  }

  const files: StorageFile[] = [];
  for (const entry of data) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null) {
      // Folder — recurse.
      files.push(...(await listBucketFiles(bucket, path)));
      continue;
    }
    if (entry.name === ".emptyFolderPlaceholder") continue;
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);
    files.push({
      path,
      publicUrl,
      sizeBytes: entry.metadata?.size ?? 0,
      mimeType: entry.metadata?.mimetype ?? "",
      updatedAt: entry.updated_at ?? null,
    });
  }
  return files;
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

  // Videos pass through untouched; images go through the WebP compressor.
  const toUpload = isVideo ? file : await compressImageToWebp(file);

  const now = new Date();
  const folder = `${isVideo ? "videos/" : ""}${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const path = `${folder}/${now.getTime()}-${slugifyFilename(toUpload.name)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, toUpload, {
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
  if (toUpload.type.startsWith("image/")) {
    const probed = await probeImageDimensions(toUpload).catch(() => null);
    if (probed) {
      width = probed.width;
      height = probed.height;
    }
  } else if (isVideo) {
    const probed = await probeVideoDimensions(toUpload).catch(() => null);
    if (probed) {
      width = probed.width;
      height = probed.height;
    }
  }

  return {
    publicUrl,
    storagePath: path,
    mimeType: toUpload.type,
    sizeBytes: toUpload.size,
    width,
    height,
  };
}
