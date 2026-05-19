"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Menu, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ME_QUERY } from "@/lib/graphql";
import { AdminThemeToggle } from "./AdminThemeToggle";

type MeData = {
  me: {
    userId: string;
    isAdmin: boolean;
  };
};

const NAV_GROUPS: {
  title: string;
  items: { label: string; href: string; disabled?: boolean }[];
}[] = [
  {
    title: "Operación",
    items: [
      { label: "Dashboard", href: "/admin" },
      { label: "Usuarios", href: "/admin/users" },
    ],
  },
  {
    title: "Contenido",
    items: [
      { label: "Posts", href: "/admin/content/posts" },
      { label: "Páginas", href: "/admin/content/pages" },
      { label: "Recursos", href: "/admin/content/resources" },
      { label: "Categorías de ayuda", href: "/admin/content/resources/categories" },
      { label: "Media", href: "/admin/content/media" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { label: "Jobs", href: "/admin/system/jobs" },
      { label: "Audit log", href: "/admin/system/audit" },
      { label: "Stats", href: "/admin/system/stats" },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
      if (!data.session) router.replace("/login?return_to=/admin");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) router.replace("/login?return_to=/admin");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  // Cierra el drawer móvil al cambiar de ruta.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Bloquea el scroll del body mientras el drawer móvil está abierto.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    if (mobileOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const { data, loading, error } = useQuery<MeData>(ME_QUERY, {
    skip: !session,
    fetchPolicy: "cache-and-network",
  });

  if (checkingSession || (!data && loading)) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-text-muted">
        Cargando…
      </div>
    );
  }

  if (!session) return null;

  const isAdmin = data?.me?.isAdmin === true;
  if (error || !isAdmin) {
    return <AdminForbidden />;
  }

  const navContent = (
    <>
      <nav className="space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {group.title}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname?.startsWith(item.href);
                if (item.disabled) {
                  return (
                    <li key={item.href}>
                      <span className="block cursor-not-allowed rounded px-2 py-1 text-sm text-text-muted opacity-60">
                        {item.label}
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={
                        "block rounded px-2 py-1 text-sm transition-colors " +
                        (active
                          ? "bg-accent/15 text-accent"
                          : "text-text hover:bg-bg")
                      }
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="mt-8 border-t border-border pt-4 text-xs text-text-muted">
        <div className="truncate">{session.user.email}</div>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="mt-2 text-accent hover:underline"
        >
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div data-admin="true" className="min-h-screen bg-bg text-text">
      {/* Topbar móvil */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-surface px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-text hover:bg-bg"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/admin" className="text-base font-semibold tracking-tight">
          Continuity Admin
        </Link>
        <AdminThemeToggle />
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        {/* Sidebar fijo (desktop) */}
        <aside className="hidden w-64 shrink-0 border-r border-border bg-surface px-4 py-6 md:block">
          <div className="mb-6 flex items-center justify-between gap-2">
            <Link
              href="/admin"
              className="block text-lg font-semibold tracking-tight"
            >
              Continuity Admin
            </Link>
            <AdminThemeToggle />
          </div>
          {navContent}
        </aside>

        {/* Drawer móvil */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative ml-0 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-border bg-surface px-4 py-5 shadow-xl">
              <div className="mb-6 flex items-center justify-between gap-2">
                <Link
                  href="/admin"
                  className="block text-lg font-semibold tracking-tight"
                  onClick={() => setMobileOpen(false)}
                >
                  Continuity Admin
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Cerrar menú"
                  className="inline-flex h-8 w-8 items-center justify-center rounded text-text-muted hover:bg-bg hover:text-text"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {navContent}
            </aside>
          </div>
        )}

        <main className="flex-1 px-4 py-6 md:px-10 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function AdminForbidden() {
  return (
    <div
      data-admin="true"
      className="min-h-screen bg-bg flex items-center justify-center px-6"
    >
      <div className="max-w-md rounded-lg border border-border bg-surface p-8 text-center">
        <h1 className="text-xl font-semibold text-text">Acceso denegado</h1>
        <p className="mt-2 text-sm text-text-muted">
          Tu cuenta está autenticada pero no tiene permisos de administrador.
          Si crees que esto es un error, contacta al equipo.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  );
}
