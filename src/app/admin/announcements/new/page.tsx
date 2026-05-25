"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client";
import { ADMIN_ANNOUNCEMENT_CREATE } from "@/lib/graphql";
import { toast } from "@/lib/toast";
import { AnnouncementForm, type FormState } from "../_form";

const DEFAULT: FormState = {
  title: "",
  body: "",
  severity: "info",
  audiencePlans: [],
  audienceUserIds: "",
  startsAt: "",
  endsAt: "",
  dismissible: true,
  ctaLabel: "",
  ctaUrl: "",
};

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [create, { loading }] = useMutation(ADMIN_ANNOUNCEMENT_CREATE, {
    onCompleted: () => {
      toast.success("Anuncio creado");
      router.push("/admin/announcements");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <AnnouncementForm
      initial={DEFAULT}
      loading={loading}
      onSubmit={(data) => create({ variables: { data } })}
      submitLabel="Crear anuncio"
    />
  );
}
