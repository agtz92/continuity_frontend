"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Bell,
  BookOpen,
  Bug,
  ChevronLeft,
  Compass,
  CreditCard,
  Database,
  Globe,
  LibraryBig,
  LogOut,
  MessageCircle,
  MessagesSquare,
  Palette,
  Plug,
  Tags,
  User,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { UserAvatar } from "@/components/account/UserAvatar";

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
  const t = useTranslations("accountMenu");
  const [email, setEmail] = useState<string | null>(null);
  const pathname = usePathname();
  const openedAtPath = useRef<string | null>(null);

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

  // Remember the path at the moment the drawer opens. Tied to `open` only
  // so pathname changes don't refresh the baseline — that's the whole point.
  useEffect(() => {
    if (open) {
      openedAtPath.current = pathname;
    } else {
      openedAtPath.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close the drawer when the route changes — but not on the initial mount
  // and not on same-page reopens. This avoids the flicker where closing
  // happened at tap-time, exposing the source page before the destination
  // had rendered.
  useEffect(() => {
    if (
      open &&
      openedAtPath.current !== null &&
      pathname !== openedAtPath.current
    ) {
      onClose();
    }
  }, [pathname, open, onClose]);

  if (!open) return null;

  const initial = email ? email.trim().charAt(0).toUpperCase() : "?";

  // Link clicks don't close immediately — the route-change effect above
  // closes the drawer once the destination has rendered. This keeps the
  // drawer visible across the transition so the user never sees the source
  // page flash between drawer-close and destination-render.
  const handleNavigate = () => {};

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
      aria-label={t("ariaLabel")}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="relative w-full sm:w-[22rem] h-full bg-bg border-r border-border flex flex-col shadow-2xl">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border/80">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar size={36} fallbackInitial={initial} />
            <div className="min-w-0">
              <div className="text-text text-sm font-medium truncate">
                {email ?? "—"}
              </div>
              <div className="text-text-muted text-xs">{t("freePlan")}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text p-1.5 rounded-md hover:bg-surface transition-colors group"
            aria-label={t("close")}
            title={t("closeTooltip")}
          >
            <ChevronLeft
              size={20}
              className="transition-transform group-hover:-translate-x-0.5"
            />
          </button>
        </header>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <Group label={t("groups.settings")}>
            <RowLink
              href="/settings/profile"
              icon={User}
              label={t("items.profile")}
              onClick={handleNavigate}
            />
            <RowLink
              href="/settings/notifications"
              icon={Bell}
              label={t("items.notifications")}
              onClick={handleNavigate}
            />
            <RowLink
              href="/settings/appearance"
              icon={Palette}
              label={t("items.appearance")}
              onClick={handleNavigate}
            />
            <RowLink
              href="/settings/billing"
              icon={CreditCard}
              label={t("items.billing")}
              onClick={handleNavigate}
            />
            <RowLink
              href="/settings/plugins"
              icon={Plug}
              label={t("items.plugins")}
              onClick={handleNavigate}
            />
            <RowLink
              href="/onboarding?replay=true"
              icon={Compass}
              label={t("items.gettingStarted")}
              onClick={handleNavigate}
            />
          </Group>

          {workspace && (
            <Group label={t("groups.workspace")}>
              <RowButton
                icon={Tags}
                label={t("items.categories")}
                onClick={handleAction(workspace.onOpenCategories)}
              />
              <RowButton
                icon={Database}
                label={t("items.exportBackup")}
                onClick={handleAction(workspace.onOpenBackup)}
              />
            </Group>
          )}

          <Group label={t("groups.support")}>
            <RowLink
              href="/welcome"
              icon={Globe}
              label={t("items.viewLanding")}
              onClick={handleNavigate}
            />
            <RowLink
              href="/blog"
              icon={BookOpen}
              label={t("items.blog")}
              onClick={handleNavigate}
            />
            <RowPending icon={LibraryBig} label={t("items.resources")} badge={t("items.comingSoon")} />
            <RowExternal
              href="mailto:support@continuu.it?subject=Bug%20report"
              icon={Bug}
              label={t("items.reportBug")}
              onAfterClick={onClose}
            />
            <RowExternal
              href="https://www.reddit.com/r/Continuuit/"
              icon={MessageCircle}
              label={t("items.reddit")}
              onAfterClick={onClose}
            />
            <RowExternal
              // TODO: replace with the real Discord invite URL once the server exists
              href="#"
              icon={MessagesSquare}
              label={t("items.discord")}
              onAfterClick={onClose}
            />
          </Group>
        </nav>

        <footer className="px-3 py-3 border-t border-border/80">
          <RowButton
            icon={LogOut}
            label={t("items.signOut")}
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
      <div className="px-3 mb-2 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
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
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text hover:bg-surface transition-colors"
    >
      <Icon size={16} className="text-text-muted" />
      <span>{label}</span>
    </Link>
  );
}

function RowExternal({
  href,
  icon: Icon,
  label,
  onAfterClick,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  onAfterClick?: () => void;
}) {
  const isMailto = href.startsWith("mailto:");
  return (
    <a
      href={href}
      target={isMailto ? undefined : "_blank"}
      rel={isMailto ? undefined : "noopener noreferrer"}
      onClick={onAfterClick}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text hover:bg-surface transition-colors"
    >
      <Icon size={16} className="text-text-muted" />
      <span>{label}</span>
    </a>
  );
}

function RowPending({
  icon: Icon,
  label,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  badge: string;
}) {
  return (
    <div
      aria-disabled="true"
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted/60 cursor-not-allowed select-none"
    >
      <Icon size={16} className="text-text-muted/60" />
      <span>{label}</span>
      <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-muted border border-border">
        {badge}
      </span>
    </div>
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
          ? "text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 hover:bg-red-500/10"
          : "text-text-muted hover:text-text hover:bg-surface"
      }`}
    >
      <Icon size={16} className={danger ? "text-red-400" : "text-text-muted"} />
      <span>{label}</span>
    </button>
  );
}
