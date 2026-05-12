"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { UserAvatar } from "@/components/account/UserAvatar";

export function AccountMenuTrigger({ onClick }: { onClick: () => void }) {
  const t = useTranslations("accountMenu");
  const [initial, setInitial] = useState<string>("?");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user.email;
      if (email) setInitial(email.trim().charAt(0).toUpperCase());
    });
  }, []);

  return (
    <button
      onClick={onClick}
      className="rounded-full hover:opacity-80 transition-opacity"
      aria-label={t("ariaLabel")}
      title={t("openTooltip")}
    >
      <UserAvatar size={36} fallbackInitial={initial} />
    </button>
  );
}
