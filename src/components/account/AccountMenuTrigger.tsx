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
      className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 flex items-center justify-center text-white font-semibold text-sm transition-colors"
      aria-label={t("ariaLabel")}
      title={t("openTooltip")}
    >
      {initial}
    </button>
  );
}
