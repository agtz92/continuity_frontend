"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { LanguageSelector } from "@/components/settings/LanguageSelector";

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
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-5">
        <Field label={t("email")} value={email} />
        {createdAt && <Field label={t("memberSince")} value={createdAt} />}
        <div className="pt-1">
          <LanguageSelector />
        </div>
        <div className="pt-2 flex items-center gap-2 text-xs text-zinc-500">
          <User size={14} /> {t("moreSoon")}
        </div>
      </section>
    </SettingsShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="text-sm text-zinc-100">{value}</div>
    </div>
  );
}
