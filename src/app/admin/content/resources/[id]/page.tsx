"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import { useTranslations } from "next-intl";
import {
  ADMIN_HELP_CATEGORIES_QUERY,
  ADMIN_HELP_RESOURCE_DELETE,
  ADMIN_HELP_RESOURCE_PUBLISH,
  ADMIN_HELP_RESOURCE_QUERY,
  ADMIN_HELP_RESOURCE_UPDATE,
  ADMIN_MEDIA_REGISTER,
} from "@/lib/graphql";
import { RichEditor } from "@/components/admin/RichEditor";
import { CoverImageField } from "@/components/admin/CoverImageField";
import { uploadCmsImage, uploadCmsMedia } from "@/lib/cmsStorage";
import { revalidateCmsCache } from "@/lib/revalidateCms";
import { toast } from "@/lib/toast";

type Category = {
  id: string;
  slug: string;
  name: string;
};

type ResourceFields = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentJson: object;
  contentHtml: string;
  coverImageUrl: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  status: string;
  publishedAt: string | null;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  locale: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export default function EditResourcePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const tCommon = useTranslations("common");
  const tToast = useTranslations("admin.toast");

  const { data, loading, error, refetch } = useQuery<{
    adminHelpResource: ResourceFields;
  }>(ADMIN_HELP_RESOURCE_QUERY, { variables: { id } });

  const { data: catsData } = useQuery<{ adminHelpCategories: Category[] }>(
    ADMIN_HELP_CATEGORIES_QUERY
  );

  const original = data?.adminHelpResource;
  const categories = catsData?.adminHelpCategories ?? [];

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [cover, setCover] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [locale, setLocale] = useState("es");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [order, setOrder] = useState(0);
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
    setCategoryId(original.categoryId);
    setOrder(original.order || 0);
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

  const [update, { loading: saving }] = useMutation(
    ADMIN_HELP_RESOURCE_UPDATE,
    {
      onCompleted: (res) => {
        toast.success(tCommon("saved"));
        const updatedSlug = res?.adminHelpResourceUpdate?.slug;
        if (original?.status === "published") {
          revalidateCmsCache({ kind: "resource", slug: updatedSlug });
        }
      },
      onError: (e) => toast.error(e.message),
    }
  );
  const [publish, { loading: publishing }] = useMutation(
    ADMIN_HELP_RESOURCE_PUBLISH,
    {
      onCompleted: (res) => {
        toast.success(tToast("statusUpdated"));
        revalidateCmsCache({
          kind: "resource",
          slug: res?.adminHelpResourcePublish?.slug,
        });
        refetch();
      },
      onError: (e) => toast.error(e.message),
    }
  );
  const [deleteResource, { loading: deleting }] = useMutation(
    ADMIN_HELP_RESOURCE_DELETE,
    {
      onCompleted: () => {
        toast.success(tToast("resourceDeleted") || "Recurso eliminado");
        revalidateCmsCache({ kind: "resource", slug: original?.slug });
        router.push("/admin/content/resources");
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
          categoryId,
          excerpt,
          contentJson,
          coverImageUrl: cover,
          tags,
          seoTitle,
          seoDescription,
          locale,
          order,
        },
      },
    });
  };

  const handlePublishToggle = () => {
    if (!original) return;
    const becomingPublic = original.status !== "published";
    const publicBase = locale === "es" ? "/recursos" : "/resources";
    if (
      !confirm(
        becomingPublic
          ? `¿Publicar este recurso en continuu.it${publicBase}?`
          : "¿Despublicar este recurso?"
      )
    ) {
      return;
    }
    publish({ variables: { id, published: becomingPublic } });
  };

  const handleDelete = () => {
    if (!confirm("¿Eliminar el recurso permanentemente?")) return;
    deleteResource({ variables: { id } });
  };

  const handleUploadImage = async (file: File): Promise<string | null> => {
    const uploaded = await uploadCmsImage(file);
    if (!uploaded) {
      toast.error(tToast("imageUploadError"));
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
      /* best-effort */
    }
    return uploaded.publicUrl;
  };

  const handleUploadMedia = async (file: File) => {
    const uploaded = await uploadCmsMedia(file);
    if (!uploaded) {
      toast.error(tToast("imageUploadError"));
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
      /* best-effort */
    }
    return uploaded;
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
            href="/admin/content/resources"
            className="text-sm text-accent hover:underline"
          >
            ← Volver
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-text">
            {title || "Sin título"}
          </h1>
          <div className="mt-1 text-xs text-text-muted">
            {isPublished ? "Publicado" : "Borrador"} · {original.categoryName} ·
            creado {new Date(original.createdAt).toLocaleString()} · última
            edición {new Date(original.updatedAt).toLocaleString()}
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
                onUploadMedia={handleUploadMedia}
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
            <Field label="Categoría">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text outline-none focus:border-accent"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Orden en categoría">
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value) || 0)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text outline-none focus:border-accent"
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
            <Field label="Imagen de portada">
              <CoverImageField
                value={cover}
                onChange={setCover}
                uploadErrorMessage={tToast("imageUploadError")}
              />
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
            <p className="-mt-1 text-xs text-text-muted">
              Si los dejas vacíos, se usan el título y el resumen.
            </p>
            <Field label="Título SEO">
              <input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={title || "Se usa el título"}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text outline-none focus:border-accent"
              />
            </Field>
            <Field label="Meta descripción">
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
                placeholder={excerpt || "Se usa el resumen / excerpt"}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text outline-none focus:border-accent"
              />
            </Field>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 text-xs uppercase tracking-wide text-text-muted">
        {label}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-text-muted">{label}</label>
      {children}
    </div>
  );
}
