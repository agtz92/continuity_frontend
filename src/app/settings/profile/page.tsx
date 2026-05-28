"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, User } from "lucide-react";
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
  // null = still loading; we only render the link/connected UI once known so
  // the button doesn't flash before we know whether Google is already linked.
  const [googleLinked, setGoogleLinked] = useState<boolean | null>(null);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

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

  useEffect(() => {
    supabase.auth.getUserIdentities().then(({ data }) => {
      const linked = !!data?.identities?.some((i) => i.provider === "google");
      setGoogleLinked(linked);
    });
  }, []);

  const handleLinkGoogle = async () => {
    setLinking(true);
    setLinkError(null);
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings/profile`,
      },
    });
    // On success the browser navigates to Google; we only land here on failure
    // (e.g. manual linking disabled in the Supabase project).
    if (error) {
      setLinkError(error.message || t("googleLinkError"));
      setLinking(false);
    }
  };

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

      <section className="bg-surface/50 border border-border rounded-xl p-5 space-y-4">
        <div className="text-xs text-text-muted">{t("connectedAccounts")}</div>
        {googleLinked === true && (
          <div className="flex items-center gap-3">
            <GoogleIcon />
            <span className="text-sm text-text">{t("googleConnected")}</span>
            <Check size={16} className="ml-auto text-green-500" />
          </div>
        )}
        {googleLinked === false && (
          <div>
            <button
              type="button"
              onClick={handleLinkGoogle}
              disabled={linking}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm font-medium text-[#1f1f1f] transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
            >
              <GoogleIcon />
              {linking ? t("googleConnecting") : t("googleConnect")}
            </button>
            <p className="mt-2 text-xs text-text-muted">
              {t("googleConnectDescription")}
            </p>
            {linkError && (
              <p className="mt-2 text-xs text-red-500">{linkError}</p>
            )}
          </div>
        )}
      </section>
      {pickerOpen && (
        <AvatarPickerModal onClose={() => setPickerOpen(false)} />
      )}
    </SettingsShell>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58Z"
      />
    </svg>
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
