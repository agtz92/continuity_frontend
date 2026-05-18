"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import { useTranslations } from "next-intl";
import {
  ADMIN_MEDIA_REGISTER,
  ADMIN_PAGE_DELETE,
  ADMIN_PAGE_PUBLISH,
  ADMIN_PAGE_QUERY,
  ADMIN_PAGE_UPDATE,
} from "@/lib/graphql";
import { RichEditor } from "@/components/admin/RichEditor";
import { uploadCmsImage, uploadCmsMedia } from "@/lib/cmsStorage";
import { revalidateCmsCache } from "@/lib/revalidateCms";
import { toast } from "@/lib/toast";

type PageFields = {
  id: string;
  path: string;
  title: string;
  excerpt: string;
  contentJson: object;
  coverImageUrl: string;
  status: string;
  publishedAt: string | null;
  showInNav: boolean;
  navOrder: number;
  seoTitle: string;
  seoDescription: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
};

export default function EditPagePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const tCommon = useTranslations("common");
  const tToast = useTranslations("admin.toast");

  const { data, loading, error, refetch } = useQuery<{
    adminPage: PageFields;
  }>(ADMIN_PAGE_QUERY, { variables: { id } });
  const original = data?.adminPage;

  const [title, setTitle] = useState("");
  const [path, setPath] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [cover, setCover] = useState("");
  const [locale, setLocale] = useState("es");
  const [showInNav, setShowInNav] = useState(false);
  const [navOrder, setNavOrder] = useState(0);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [contentJson, setContentJson] = useState<object | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!original || hydrated) return;
    setTitle(original.title);
    setPath(original.path);
    setExcerpt(original.excerpt);
    setCover(original.coverImageUrl);
    setLocale(original.locale || "es");
    setShowInNav(original.showInNav);
    setNavOrder(original.navOrder);
    setSeoTitle(original.seoTitle);
    setSeoDescription(original.seoDescription);
    setContentJson(original.contentJson);
    setHydrated(true);
  }, [original, hydrated]);

  const [update, { loading: saving }] = useMutation(ADMIN_PAGE_UPDATE, {
    onCompleted: (res) => {
      toast.success(tCommon("saved"));
      const updatedPath = res?.adminPageUpdate?.path;
      if (original?.status === "published") {
        revalidateCmsCache({ kind: "page", path: updatedPath });
      }
    },
    onError: (e) => toast.error(e.message),
  });
  const [publish, { loading: publishing }] = useMutation(ADMIN_PAGE_PUBLISH, {
    onCompleted: (res) => {
      toast.success(tToast("statusUpdated"));
      revalidateCmsCache({
        kind: "page",
        path: res?.adminPagePublish?.path,
      });
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const [del, { loading: deleting }] = useMutation(ADMIN_PAGE_DELETE, {
    onCompleted: () => {
      toast.success(tToast("pageDeleted"));
      revalidateCmsCache({ kind: "page", path: original?.path });
      router.push("/admin/content/pages");
    },
    onError: (e) => toast.error(e.message),
  });
  const [registerMedia] = useMutation(ADMIN_MEDIA_REGISTER);

  if (loading && !original) return <div className="text-text-muted">Cargando…</div>;
  if (error)
    return (
      <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error.message}
      </div>
    );
  if (!original) return null;

  const isPublished = original.status === "published";

  const handleSave = () => {
    if (!contentJson) return;
    update({
      variables: {
        id,
        data: {
          title,
          path,
          excerpt,
          contentJson,
          coverImageUrl: cover,
          showInNav,
          navOrder,
          seoTitle,
          seoDescription,
          locale,
        },
      },
    });
  };

  const handlePublishToggle = () => {
    const next = !isPublished;
    if (!confirm(next ? "¿Publicar esta página?" : "¿Despublicar?")) return;
    publish({ variables: { id, published: next } });
  };

  const handleDelete = () => {
    if (!confirm("¿Eliminar la página permanentemente?")) return;
    del({ variables: { id } });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/content/pages"
            className="text-sm text-accent hover:underline"
          >
            ← Volver
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-text">
            {title || "Sin título"}
          </h1>
          <div className="mt-1 text-xs text-text-muted">
            {isPublished ? "Publicado" : "Borrador"} · {path}
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
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text"
              />
            </Field>
            <Field label="Path">
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm font-mono text-text"
              />
            </Field>
            <Field label="Excerpt">
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text"
              />
            </Field>
            <Field label="Imagen de portada (URL)">
              <input
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text"
              />
            </Field>
            <Field label="Idioma">
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text"
              >
                <option value="es">Español</option>
                <option value="en">Inglés</option>
              </select>
            </Field>
          </Section>

          <Section label="Navegación">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showInNav}
                onChange={(e) => setShowInNav(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              Mostrar en el menú principal
            </label>
            <Field label="Orden (menor = primero)">
              <input
                type="number"
                value={navOrder}
                onChange={(e) => setNavOrder(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text"
              />
            </Field>
          </Section>

          <Section label="SEO">
            <Field label="Título SEO">
              <input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text"
              />
            </Field>
            <Field label="Meta descripción">
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text"
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
