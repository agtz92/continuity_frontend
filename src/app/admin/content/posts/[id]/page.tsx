"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import {
  ADMIN_BLOG_POST_DELETE,
  ADMIN_BLOG_POST_PUBLISH,
  ADMIN_BLOG_POST_QUERY,
  ADMIN_BLOG_POST_UPDATE,
  ADMIN_MEDIA_REGISTER,
} from "@/lib/graphql";
import { RichEditor } from "@/components/admin/RichEditor";
import { uploadCmsImage } from "@/lib/cmsStorage";
import { revalidateCmsCache } from "@/lib/revalidateCms";
import { toast } from "@/lib/toast";

type PostFields = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentJson: object;
  contentHtml: string;
  coverImageUrl: string;
  status: string;
  publishedAt: string | null;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
};

export default function EditBlogPostPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();

  const { data, loading, error, refetch } = useQuery<{
    adminBlogPost: PostFields;
  }>(ADMIN_BLOG_POST_QUERY, { variables: { id } });

  const original = data?.adminBlogPost;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [cover, setCover] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [locale, setLocale] = useState("es");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [contentJson, setContentJson] = useState<object | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!original || hydrated) return;
    setTitle(original.title);
    setSlug(original.slug);
    setExcerpt(original.excerpt);
    setCover(original.coverImageUrl);
    setTagsRaw((original.tags || []).join(", "));
    setLocale(original.locale || "es");
    setSeoTitle(original.seoTitle);
    setSeoDescription(original.seoDescription);
    setContentJson(original.contentJson);
    setHydrated(true);
  }, [original, hydrated]);

  const tags = useMemo(
    () =>
      tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsRaw]
  );

  const [update, { loading: saving }] = useMutation(ADMIN_BLOG_POST_UPDATE, {
    onCompleted: (res) => {
      toast.success("Guardado");
      const slug = res?.adminBlogPostUpdate?.slug;
      if (original?.status === "published") {
        revalidateCmsCache({ kind: "post", slug });
      }
    },
    onError: (e) => toast.error(e.message),
  });
  const [publish, { loading: publishing }] = useMutation(
    ADMIN_BLOG_POST_PUBLISH,
    {
      onCompleted: (res) => {
        toast.success("Estado actualizado");
        revalidateCmsCache({
          kind: "post",
          slug: res?.adminBlogPostPublish?.slug,
        });
        refetch();
      },
      onError: (e) => toast.error(e.message),
    }
  );
  const [deletePost, { loading: deleting }] = useMutation(
    ADMIN_BLOG_POST_DELETE,
    {
      onCompleted: () => {
        toast.success("Entrada eliminada");
        revalidateCmsCache({ kind: "post", slug: original?.slug });
        router.push("/admin/content/posts");
      },
      onError: (e) => toast.error(e.message),
    }
  );
  const [registerMedia] = useMutation(ADMIN_MEDIA_REGISTER);

  const handleSave = () => {
    if (!contentJson) return;
    update({
      variables: {
        id,
        data: {
          title,
          slug,
          excerpt,
          contentJson,
          coverImageUrl: cover,
          tags,
          seoTitle,
          seoDescription,
          locale,
        },
      },
    });
  };

  const handlePublishToggle = () => {
    if (!original) return;
    const becomingPublic = original.status !== "published";
    if (
      !confirm(
        becomingPublic
          ? "¿Publicar esta entrada en continuu.it/blog?"
          : "¿Despublicar esta entrada?"
      )
    ) {
      return;
    }
    publish({ variables: { id, published: becomingPublic } });
  };

  const handleDelete = () => {
    if (!confirm("¿Eliminar la entrada permanentemente?")) return;
    deletePost({ variables: { id } });
  };

  const handleUploadImage = async (file: File): Promise<string | null> => {
    const uploaded = await uploadCmsImage(file);
    if (!uploaded) {
      toast.error("Error al subir imagen");
      return null;
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
    } catch {
      // Registration is best-effort — the file is uploaded either way.
    }
    return uploaded.publicUrl;
  };

  if (loading && !original) return <div className="text-text-muted">Cargando…</div>;
  if (error)
    return (
      <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error.message}
      </div>
    );
  if (!original) return null;

  const isPublished = original.status === "published";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/content/posts"
            className="text-sm text-accent hover:underline"
          >
            ← Volver
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-text">
            {title || "Sin título"}
          </h1>
          <div className="mt-1 text-xs text-text-muted">
            {isPublished ? "Publicado" : "Borrador"} · creado{" "}
            {new Date(original.createdAt).toLocaleString()} · última edición{" "}
            {new Date(original.updatedAt).toLocaleString()}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-bg disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={handlePublishToggle}
            disabled={publishing}
            className="rounded border border-accent px-3 py-1.5 text-sm font-medium text-accent disabled:opacity-50"
          >
            {isPublished ? "Despublicar" : "Publicar"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded border border-red-500/40 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section label="Contenido">
            {hydrated && (
              <RichEditor
                initialContent={contentJson}
                onChange={setContentJson}
                onUploadImage={handleUploadImage}
              />
            )}
          </Section>
        </div>

        <div className="space-y-4">
          <Section label="Metadatos">
            <Field label="Título">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text outline-none focus:border-accent"
              />
            </Field>
            <Field label="Slug">
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm font-mono text-text outline-none focus:border-accent"
              />
            </Field>
            <Field label="Resumen / excerpt">
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text outline-none focus:border-accent"
              />
            </Field>
            <Field label="Imagen de portada (URL)">
              <input
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="https://…"
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text outline-none focus:border-accent"
              />
              {cover && (
                <img
                  src={cover}
                  alt="cover"
                  className="mt-2 max-h-32 rounded border border-border object-cover"
                />
              )}
            </Field>
            <Field label="Tags (separados por coma)">
              <input
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text outline-none focus:border-accent"
              />
            </Field>
            <Field label="Idioma">
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text outline-none focus:border-accent"
              >
                <option value="es">Español</option>
                <option value="en">Inglés</option>
              </select>
            </Field>
          </Section>

          <Section label="SEO">
            <Field label="Título SEO">
              <input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text outline-none focus:border-accent"
              />
            </Field>
            <Field label="Meta descripción">
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text outline-none focus:border-accent"
              />
            </Field>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 text-xs uppercase tracking-wide text-text-muted">
        {label}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-text-muted">{label}</label>
      {children}
    </div>
  );
}
