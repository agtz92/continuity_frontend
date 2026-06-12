"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import {
  ADMIN_ANNOUNCEMENT_QUERY,
  ADMIN_ANNOUNCEMENT_UPDATE,
} from "@/lib/graphql";
import { toast } from "@/lib/toast";
import { AnnouncementForm, type FormState } from "../_form";

type Announcement = {
  id: string;
  title: string;
  body: string;
  severity: string;
  status: string;
  audiencePlans: string[];
  audienceUserIds: string[];
  startsAt: string | null;
  endsAt: string | null;
  dismissible: boolean;
  ctaLabel: string;
  ctaUrl: string;
};

function toLocalInput(s: string | null): string {
  if (!s) return "";
  try {
    const d = new Date(s);
    // <input type="datetime-local"> expects "YYYY-MM-DDTHH:mm"
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

export default function EditAnnouncementPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";

  const { data, loading: loadingQ, error } = useQuery<{
    adminAnnouncement: Announcement;
  }>(ADMIN_ANNOUNCEMENT_QUERY, { variables: { id } });

  const [update, { loading: loadingM }] = useMutation(ADMIN_ANNOUNCEMENT_UPDATE, {
    onCompleted: () => {
      toast.success("Anuncio actualizado");
      router.push("/admin/announcements");
    },
    onError: (e) => toast.error(e.message),
  });

  if (loadingQ) return <div className="text-text-muted">Cargando…</div>;
  if (error)
    return (
      <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error.message}
      </div>
    );
  if (!data?.adminAnnouncement) return null;

  const a = data.adminAnnouncement;
  const initial: FormState = {
    title: a.title,
    body: a.body,
    severity: a.severity,
    audiencePlans: a.audiencePlans,
    audienceUserIds: a.audienceUserIds.join("\n"),
    startsAt: toLocalInput(a.startsAt),
    endsAt: toLocalInput(a.endsAt),
    dismissible: a.dismissible,
    ctaLabel: a.ctaLabel,
    ctaUrl: a.ctaUrl,
  };

  return (
    <AnnouncementForm
      initial={initial}
      loading={loadingM}
      onSubmit={(d) => update({ variables: { id, data: d } })}
      submitLabel="Guardar cambios"
    />
  );
}
