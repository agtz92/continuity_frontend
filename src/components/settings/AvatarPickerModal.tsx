"use client";

import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import {
  AVATAR_STYLES,
  avatarsByStyle,
  getAvatarUrl,
  type AvatarStyle,
} from "@/lib/avatars";
import { useUserAvatar } from "@/hooks/useUserAvatar";

export function AvatarPickerModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations();
  const { avatarId, setAvatar } = useUserAvatar();
  const grouped = avatarsByStyle();

  const handlePick = async (id: string) => {
    const ok = await setAvatar(id);
    if (ok) onClose();
  };

  const handleClear = async () => {
    const ok = await setAvatar(null);
    if (ok) onClose();
  };

  return (
    <Modal
      title={t("settings.profile.pickerTitle")}
      onClose={onClose}
      widthClassName="sm:w-[42rem] md:w-[56rem] lg:w-[78rem] sm:min-w-[20rem] sm:max-w-[min(95vw,80rem)]"
    >
      <div className="flex-1 min-h-0 overflow-y-auto space-y-8 pr-1">
        {AVATAR_STYLES.map((style: AvatarStyle) => {
          const items = grouped[style];
          if (items.length === 0) return null;
          return (
            <section key={style}>
              <h4 className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-4">
                {t(`avatars.styles.${style}`)}
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-5 sm:gap-x-6 sm:gap-y-6">
                {items.map((a) => {
                  const selected = a.id === avatarId;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handlePick(a.id)}
                      className="flex flex-col items-center gap-2 group focus:outline-none"
                      aria-label={t(`avatars.names.${a.nameKey}`)}
                    >
                      <img
                        src={getAvatarUrl(a.id)}
                        alt=""
                        className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-28 lg:h-28 rounded-full object-cover transition-transform group-hover:scale-105 ${
                          selected
                            ? "ring-2 ring-accent ring-offset-2 ring-offset-surface"
                            : "ring-1 ring-border"
                        }`}
                      />
                      <span className="text-xs sm:text-sm text-text-muted group-hover:text-text truncate max-w-full">
                        {t(`avatars.names.${a.nameKey}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <div className="pt-4 mt-2 border-t border-border flex justify-end shrink-0">
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-text-muted hover:text-text"
        >
          {t("settings.profile.clearAvatar")}
        </button>
      </div>
    </Modal>
  );
}
