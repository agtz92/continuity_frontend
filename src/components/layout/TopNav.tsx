"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AccountMenu } from "@/components/account/AccountMenu";
import { AccountMenuTrigger } from "@/components/account/AccountMenuTrigger";

export type WorkspaceActions = {
  onOpenCategories: () => void;
  onOpenBackup: () => void;
};

type NavLink = {
  href: string;
  label: string;
  /** Match exact path, or prefix (default exact). */
  match?: "exact" | "prefix";
};

/**
 * Global app/marketing top bar.
 *
 * Layout: [avatar] [brand] [nav links] · · · [right-slot]
 *
 * `workspace` is optional — when provided (e.g. from Dashboard), the
 * AccountMenu drawer shows Categories + Export; otherwise that section is
 * hidden. This keeps the same chrome usable on settings pages and, eventually,
 * on public marketing pages where workspace actions don't apply.
 */
export function TopNav({
  links = [],
  workspace,
  rightSlot,
}: {
  links?: NavLink[];
  workspace?: WorkspaceActions;
  rightSlot?: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/80 bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center gap-3 sm:gap-4">
          <AccountMenuTrigger onClick={() => setMenuOpen(true)} />
          <Link
            href="/"
            className="font-bold text-lg bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent shrink-0"
          >
            Continuity
          </Link>

          {links.length > 0 && (
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {links.map((l) => {
                const active =
                  l.match === "prefix"
                    ? pathname?.startsWith(l.href) ?? false
                    : pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      active
                        ? "text-text bg-surface"
                        : "text-text-muted hover:text-text hover:bg-surface/60"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="flex-1" />

          {rightSlot}
        </div>
      </header>

      <AccountMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        workspace={workspace}
        onSignOut={handleSignOut}
      />
    </>
  );
}
