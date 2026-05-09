"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Bell,
  CreditCard,
  Plug,
  User,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLocaleSync } from "@/hooks/useLocaleSync";
import { TopNav } from "@/components/layout/TopNav";

type NavItem = {
  href: string;
  key: "profile" | "notifications" | "billing" | "plugins";
  icon: LucideIcon;
};

const NAV: NavItem[] = [
  { href: "/settings/profile", key: "profile", icon: User },
  { href: "/settings/notifications", key: "notifications", icon: Bell },
  { href: "/settings/billing", key: "billing", icon: CreditCard },
  { href: "/settings/plugins", key: "plugins", icon: Plug },
];

/** Layout for /settings/* pages: gates auth, renders left rail + main content. */
export function SettingsShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  useLocaleSync();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("settings.nav");
  const tCommon = useTranslations("common");
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
      if (!data.session) router.replace("/login");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) router.replace("/login");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        {tCommon("loading")}
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <TopNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 mb-6 text-sm group"
        >
          <ArrowLeft
            size={14}
            className="transition-transform group-hover:-translate-x-0.5"
          />
          {tCommon("backToDashboard")}
        </Link>
        <div className="grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-6 md:gap-10">
          <aside className="md:sticky md:top-8 md:self-start">
            <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-3 px-2">
              {t("label")}
            </div>
            <nav className="space-y-0.5">
              {NAV.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? "bg-zinc-900 text-zinc-100"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60"
                    }`}
                  >
                    <Icon
                      size={16}
                      className={active ? "text-emerald-400" : "text-zinc-500"}
                    />
                    {t(item.key)}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main>
            <header className="mb-6">
              <h1 className="text-2xl font-bold">{title}</h1>
              {description && (
                <p className="text-zinc-400 text-sm mt-1">{description}</p>
              )}
            </header>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
