"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CreditCard,
  Database,
  LogOut,
  Plug,
  Tags,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Workspace = {
  onOpenCategories: () => void;
  onOpenBackup: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Dashboard-only actions. When omitted, the Workspace section is hidden. */
  workspace?: Workspace;
  onSignOut: () => void;
};

export function AccountMenu({ open, onClose, workspace, onSignOut }: Props) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock background scroll while open
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const initial = email ? email.trim().charAt(0).toUpperCase() : "?";

  const handleNavigate = () => onClose(); // close drawer when a Link is clicked

  const handleAction = (fn: () => void) => () => {
    onClose();
    // defer to next frame so the drawer animates out before the modal mounts
    requestAnimationFrame(fn);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-start"
      role="dialog"
      aria-modal="true"
      aria-label="Account menu"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="relative w-full sm:w-[22rem] h-full bg-zinc-950 border-r border-zinc-800 flex flex-col shadow-2xl">
        <header className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-semibold shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="text-zinc-100 text-sm font-medium truncate">
                {email ?? "—"}
              </div>
              <div className="text-zinc-500 text-xs">Free plan</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 p-1"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </header>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <Group label="Settings">
            <RowLink
              href="/settings/profile"
              icon={User}
              label="Profile"
              onClick={handleNavigate}
            />
            <RowLink
              href="/settings/notifications"
              icon={Bell}
              label="Notifications"
              onClick={handleNavigate}
            />
            <RowLink
              href="/settings/billing"
              icon={CreditCard}
              label="Billing & plan"
              onClick={handleNavigate}
            />
            <RowLink
              href="/settings/plugins"
              icon={Plug}
              label="Plugins"
              onClick={handleNavigate}
            />
          </Group>

          {workspace && (
            <Group label="Workspace">
              <RowButton
                icon={Tags}
                label="Categories"
                onClick={handleAction(workspace.onOpenCategories)}
              />
              <RowButton
                icon={Database}
                label="Export / backup"
                onClick={handleAction(workspace.onOpenBackup)}
              />
            </Group>
          )}
        </nav>

        <footer className="px-3 py-3 border-t border-zinc-800/80">
          <RowButton
            icon={LogOut}
            label="Sign out"
            onClick={handleAction(onSignOut)}
            variant="danger"
          />
        </footer>
      </aside>
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="px-3 mb-2 text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function RowLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
    >
      <Icon size={16} className="text-zinc-500" />
      <span>{label}</span>
    </Link>
  );
}

function RowButton({
  icon: Icon,
  label,
  onClick,
  variant,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}) {
  const danger = variant === "danger";
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        danger
          ? "text-red-300 hover:text-red-200 hover:bg-red-500/10"
          : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900"
      }`}
    >
      <Icon size={16} className={danger ? "text-red-400" : "text-zinc-500"} />
      <span>{label}</span>
    </button>
  );
}
