"use client";

import { useEffect, useState, useTransition } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import {
  NOTIFICATION_SETTINGS_QUERY,
  UPDATE_NOTIFICATION_SETTINGS,
} from "@/lib/graphql";
import { setPalette as setPaletteAction } from "@/palette/actions";
import {
  DEFAULT_PALETTE,
  PALETTE_COOKIE,
  PALETTE_LABEL_KEY,
  PALETTE_SWATCHES,
  SUPPORTED_PALETTES,
  type Palette,
} from "@/palette/config";
import { toast } from "@/lib/toast";

function detectEffectiveTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.dataset.theme;
  if (attr === "light" || attr === "dark") return attr;
  // attr === "system" or missing → read OS preference
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Palette selector. Only swaps accent colors; the rest of the theme
 * (bg/surface/border/text) stays controlled by ThemeSelector.
 */
export function PaletteSelector() {
  const t = useTranslations("settings.profile");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const { data } = useQuery(NOTIFICATION_SETTINGS_QUERY, {
    fetchPolicy: "cache-first",
  });
  const persisted =
    (data?.notificationSettings?.palette as Palette | undefined) ?? null;

  // Write the mutation response into the NOTIFICATION_SETTINGS_QUERY cache so
  // useThemeSync / usePaletteSync see the fresh value on subsequent navigation
  // and don't revert the change. Without this, Apollo's default cache returns
  // the old value (no `id` on NotificationSettings → no auto-normalization).
  const [updateSettings] = useMutation(UPDATE_NOTIFICATION_SETTINGS, {
    update: (cache, { data }) => {
      if (data?.updateNotificationSettings) {
        cache.writeQuery({
          query: NOTIFICATION_SETTINGS_QUERY,
          data: { notificationSettings: data.updateNotificationSettings },
        });
      }
    },
  });
  const [pending, startTransition] = useTransition();
  const [savingValue, setSavingValue] = useState<Palette | null>(null);
  const [effectiveTheme, setEffectiveTheme] = useState<"dark" | "light">("dark");

  // Refresh the effective theme whenever the underlying data-theme attribute
  // changes (ThemeSelector flips it for instant feedback) or when the OS
  // theme changes while we're on "system".
  useEffect(() => {
    setEffectiveTheme(detectEffectiveTheme());
    const observer = new MutationObserver(() => setEffectiveTheme(detectEffectiveTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMq = () => setEffectiveTheme(detectEffectiveTheme());
    mq.addEventListener?.("change", onMq);
    return () => {
      observer.disconnect();
      mq.removeEventListener?.("change", onMq);
    };
  }, []);

  const value: Palette = savingValue ?? persisted ?? DEFAULT_PALETTE;

  const onChange = (next: Palette) => {
    if (next === value) return;
    setSavingValue(next);
    document.documentElement.dataset.palette = next;
    startTransition(async () => {
      try {
        await updateSettings({ variables: { data: { palette: next } } });
        document.cookie = `${PALETTE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        await setPaletteAction(next);
        router.refresh();
        toast.success(tCommon("saved"));
      } catch {
        setSavingValue(null);
      }
    });
  };

  return (
    <div>
      <div className="text-xs text-text-muted mb-1 flex items-center gap-2">
        {t("palette")}
        {pending && <Loader2 size={12} className="animate-spin text-text-muted" />}
      </div>
      <div className="inline-flex flex-wrap gap-1 bg-bg p-1 rounded-lg border border-border">
        {SUPPORTED_PALETTES.map((p) => {
          const [a, b] = PALETTE_SWATCHES[p][effectiveTheme];
          const selected = value === p;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              disabled={pending}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors inline-flex items-center gap-2 ${
                selected
                  ? "bg-border text-text"
                  : "text-text-muted hover:text-text"
              } disabled:opacity-60`}
            >
              <span className="inline-flex">
                <span
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ background: a }}
                />
                <span
                  className="w-3 h-3 rounded-full border border-border -ml-1"
                  style={{ background: b }}
                />
              </span>
              {t(PALETTE_LABEL_KEY[p])}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-text-muted mt-2">{t("paletteHint")}</p>
    </div>
  );
}
