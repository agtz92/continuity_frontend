"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { setTheme as setThemeAction } from "@/theme/actions";
import { THEME_COOKIE } from "@/theme/config";

/**
 * Compact admin-side theme toggle. Two-state (light/dark) — for the
 * three-state selector (incl. "system"), users can still go to
 * /settings/appearance on the main app.
 *
 * Mirrors what ThemeSelector does (cookie + server action + immediate
 * DOM flip) minus the GraphQL persistence, which the user dashboard
 * owns. The cookie alone is what `resolveTheme` reads on the server.
 */
export function AdminThemeToggle() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  if (!theme) {
    // Render a stable shell during hydration to avoid layout shift.
    return (
      <div className="h-8 w-8 rounded-md border border-border bg-surface" />
    );
  }

  const next = theme === "dark" ? "light" : "dark";

  const flip = () => {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(async () => {
      await setThemeAction(next);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={flip}
      disabled={pending}
      title={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      aria-label={
        theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"
      }
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-text-muted transition-colors hover:bg-bg hover:text-text disabled:opacity-50"
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
