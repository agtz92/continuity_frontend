"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";

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
      className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-2 hover:from-accent hover:to-accent-2 flex items-center justify-center text-text font-semibold text-sm transition-colors"
      aria-label={t("ariaLabel")}
      title={t("openTooltip")}
    >
      {initial}
    </button>
  );
}
