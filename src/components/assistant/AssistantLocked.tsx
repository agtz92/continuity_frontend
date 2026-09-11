"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ListChecks, Search, Sparkles } from "lucide-react";

/**
 * What a free account sees where the chat used to be.
 *
 * Deliberately not a padlock. The entry points (header button, FAB) stay
 * exactly where they were, because this panel is the pitch: it shows what
 * Loop would do with *their* projects, with the same three examples the
 * catalogue actually answers. A screen that only says "not available on
 * your plan" teaches nobody anything.
 */
export function AssistantLocked() {
  const t = useTranslations("assistant.locked");

  const samples = [
    { icon: ListChecks, key: "sampleOverdue" as const },
    { icon: Sparkles, key: "sampleStalled" as const },
    { icon: Search, key: "sampleSearch" as const },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-5 py-8">
      <div className="mx-auto flex max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-text">{t("title")}</h3>
          <p className="text-[13px] leading-relaxed text-text-muted">
            {t("body")}
          </p>
        </div>

        <ul className="flex flex-col gap-2">
          {samples.map(({ icon: Icon, key }) => (
            <li
              key={key}
              className="flex items-start gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5"
            >
              <Icon
                size={14}
                className="mt-0.5 shrink-0 text-accent"
                aria-hidden
              />
              <span className="text-[13px] leading-snug text-text">
                {t(key)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2">
          <Link
            href="/settings/billing"
            className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-bg transition-opacity hover:opacity-90"
          >
            {t("cta")}
          </Link>
          <p className="text-[11px] leading-relaxed text-text-3">
            {t("footnote")}
          </p>
        </div>
      </div>
    </div>
  );
}
