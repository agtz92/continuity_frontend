"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SettingsShell } from "@/components/settings/SettingsShell";

export default function ProfileSettingsPage() {
  const t = useTranslations("settings.profile");
  const locale = useLocale();
  const [email, setEmail] = useState<string>("—");
  const [createdAt, setCreatedAt] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) {
        setEmail(u.email ?? "—");
        if (u.created_at) {
          setCreatedAt(new Date(u.created_at).toLocaleDateString(locale));
        }
      }
    });
  }, [locale]);

  return (
    <SettingsShell title={t("title")} description={t("description")}>
      <section className="bg-surface/50 border border-border rounded-xl p-5 space-y-5">
        <Field label={t("email")} value={email} />
        {createdAt && <Field label={t("memberSince")} value={createdAt} />}
        <div className="pt-2 flex items-center gap-2 text-xs text-text-muted">
          <User size={14} /> {t("moreSoon")}
        </div>
      </section>
    </SettingsShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className="text-sm text-text">{value}</div>
    </div>
  );
}
