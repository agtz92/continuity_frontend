"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import {
  AVATAR_STYLES,
  avatarsByStyle,
  getAvatarUrl,
  type AvatarStyle,
} from "@/lib/avatars";

export function Step3Avatar({
  name,
  onBack,
  onNext,
  busy,
}: {
  name: string;
  onBack: () => void;
  onNext: (avatarId: string) => Promise<void> | void;
  busy: boolean;
}) {
  const t = useTranslations("onboarding");
  const tAvatars = useTranslations("avatars");
  const grouped = avatarsByStyle();
  const [selected, setSelected] = useState<string | null>(null);

  const handleNext = async () => {
    if (!selected) return;
    await onNext(selected);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-text">
          {t("step3.heading", { name })}
        </h1>
        <p className="text-text-muted text-sm mt-2">{t("step3.sub")}</p>
      </div>

      <div className="flex-1 space-y-6 max-h-[55vh] overflow-y-auto pr-1">
        {AVATAR_STYLES.map((style: AvatarStyle) => {
          const items = grouped[style];
          if (items.length === 0) return null;
          return (
            <section key={style}>
              <h4 className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-3">
                {tAvatars(`styles.${style}`)}
              </h4>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
                {items.map((a) => {
                  const isSelected = a.id === selected;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelected(a.id)}
                      className="flex flex-col items-center gap-1.5 group focus:outline-none"
                      aria-label={tAvatars(`names.${a.nameKey}`)}
                      aria-pressed={isSelected}
                    >
                      <img
                        src={getAvatarUrl(a.id)}
                        alt=""
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover transition-transform group-hover:scale-105 ${
                          isSelected
                            ? "ring-2 ring-accent ring-offset-2 ring-offset-bg"
                            : "ring-1 ring-border"
                        }`}
                      />
                      <span className="text-[11px] text-text-muted group-hover:text-text truncate max-w-full">
                        {tAvatars(`names.${a.nameKey}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="text-sm text-text-muted hover:text-text disabled:opacity-50"
        >
          {t("back")}
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={busy || !selected}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-bg font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          {t("next")}
        </button>
      </div>
    </div>
  );
}
