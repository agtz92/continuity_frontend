"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { UserAvatar } from "@/components/account/UserAvatar";
import { AvatarPickerModal } from "@/components/settings/AvatarPickerModal";

export default function ProfileSettingsPage() {
  const t = useTranslations("settings.profile");
  const locale = useLocale();
  const [email, setEmail] = useState<string>("—");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState(false);

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

  const initial = email !== "—" ? email.trim().charAt(0).toUpperCase() : "?";

  return (
    <SettingsShell title={t("title")} description={t("description")}>
      <section className="bg-surface/50 border border-border rounded-xl p-5 space-y-5">
        <div>
          <div className="text-xs text-text-muted mb-2">{t("avatar")}</div>
          <div className="flex items-center gap-4">
            <UserAvatar size={72} fallbackInitial={initial} />
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="self-start px-3 py-1.5 bg-border hover:opacity-80 rounded-lg text-sm text-text transition-opacity"
              >
                {t("changeAvatar")}
              </button>
              <p className="text-xs text-text-muted">{t("avatarDescription")}</p>
            </div>
          </div>
        </div>
        <Field label={t("email")} value={email} />
        {createdAt && <Field label={t("memberSince")} value={createdAt} />}
        <div className="pt-2 flex items-center gap-2 text-xs text-text-muted">
          <User size={14} /> {t("moreSoon")}
        </div>
      </section>
      {pickerOpen && (
        <AvatarPickerModal onClose={() => setPickerOpen(false)} />
      )}
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
