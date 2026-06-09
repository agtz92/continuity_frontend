"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { useLocale, useTranslations } from "next-intl";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import {
  MARK_TOUR,
  ONBOARDING_STATE_QUERY,
} from "@/lib/graphql";

const TOUR_PARAM = "tour";

type Props = {
  /** Called when the tour finishes its last spotlight. Use this to open
   *  the "Create first project" modal so the user has a concrete next step. */
  onFinalCta: () => void;
};

type State = { onboardingState: { tourStatus: string } } | undefined;

/**
 * Driver.js-powered 3-step tour over the dashboard tabs. Triggers when:
 *   - URL has ?tour=1 (explicit replay from "Watch tour again"), OR
 *   - server state says tour_status === "pending" AND no recent dismissal
 *
 * Either path calls markTour(seen|skipped) once when the tour exits so
 * it never re-fires on its own.
 */
export function DashboardTour({ onFinalCta }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const t = useTranslations("onboarding.tour");
  const tCommon = useTranslations("onboarding");
  const { data } = useQuery<State>(ONBOARDING_STATE_QUERY, {
    fetchPolicy: "cache-first",
  });
  const [markTour] = useMutation(MARK_TOUR, {
    refetchQueries: [{ query: ONBOARDING_STATE_QUERY }],
  });
  const driverRef = useRef<Driver | null>(null);
  const startedRef = useRef(false);
  const [showFinalCta, setShowFinalCta] = useState(false);

  const forced = params?.get(TOUR_PARAM) === "1";
  const tourStatus = data?.onboardingState?.tourStatus;
  const shouldStart =
    !startedRef.current && (forced || tourStatus === "pending");

  useEffect(() => {
    if (!shouldStart || typeof window === "undefined") return;
    // Wait one frame so the tab anchors have laid out before driver
    // measures them.
    const handle = requestAnimationFrame(() => {
      // Both the desktop TabBar (`hidden md:flex`) and the mobile
      // BottomTabBar (`md:hidden`) mount with the same `data-tour`
      // attributes. `querySelector` would return whichever is first in
      // DOM (TabBar), which on mobile is `display:none` — driver.js
      // then renders the spotlight off-screen. Resolve the *visible*
      // element instead and pass it as a node, not a selector.
      const findVisible = (name: string): HTMLElement | null => {
        const nodes = document.querySelectorAll<HTMLElement>(
          `[data-tour="${name}"]`,
        );
        for (const el of nodes) {
          if (el.offsetParent !== null && el.getBoundingClientRect().width > 0) {
            return el;
          }
        }
        return null;
      };

      const projects = findVisible("projects");
      const tasks = findVisible("tasks");
      const routines = findVisible("routines");
      const assistant = findVisible("assistant");

      // The first three anchors are required. If any are missing (e.g.
      // the user is on a route that doesn't render TabBar/BottomTabBar
      // yet), bail silently and let the next visit retry — tour_status
      // stays pending until we explicitly mark it.
      if (!projects || !tasks || !routines) return;
      const assistantPresent = !!assistant;

      startedRef.current = true;
      const d = driver({
        showProgress: true,
        progressText: tCommon("progress", { current: "{{current}}", total: "{{total}}" }),
        nextBtnText: t("next"),
        prevBtnText: tCommon("back"),
        doneBtnText: t("next"),
        // The native "skip" affordance is the close icon (×) at the top
        // right. We label our own skip via the popover wrapper instead.
        allowClose: true,
        overlayOpacity: 0.6,
        stagePadding: 6,
        stageRadius: 8,
        onDestroyed: () => {
          // Distinguish completion from skip. Active step at destroy time
          // tells us — index 2 (the third step) means they advanced all
          // the way through.
          const activeIndex = d.getActiveIndex();
          const isCompleted = activeIndex === undefined;
          if (isCompleted) {
            markTour({ variables: { seen: true } }).catch(() => {});
            setShowFinalCta(true);
          } else {
            markTour({ variables: { seen: false } }).catch(() => {});
          }
          // Strip the ?tour=1 param so a refresh doesn't restart.
          if (forced) {
            router.replace("/dashboard");
          }
        },
        steps: [
          {
            element: projects,
            popover: {
              title: t("step1.title"),
              description: t("step1.body"),
            },
          },
          {
            element: tasks,
            popover: {
              title: t("step2.title"),
              description: t("step2.body"),
            },
          },
          {
            element: routines,
            popover: {
              title: t("step3.title"),
              description: t("step3.body"),
            },
          },
          ...(assistantPresent && assistant
            ? [
                {
                  element: assistant,
                  popover: {
                    title: t("step4.title"),
                    description: t("step4.body"),
                  },
                },
              ]
            : []),
        ],
      });
      driverRef.current = d;
      d.drive();
    });
    return () => cancelAnimationFrame(handle);
    // markTour and router are stable; t/tCommon are stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldStart, forced]);

  if (!showFinalCta) return null;

  return (
    <FinalCtaModal
      onPrimary={() => {
        setShowFinalCta(false);
        onFinalCta();
      }}
      onSecondary={() => setShowFinalCta(false)}
    />
  );
}

function FinalCtaModal({
  onPrimary,
  onSecondary,
}: {
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  const t = useTranslations("onboarding.tour.finalCta");
  const locale = useLocale();
  const resourcesHref = locale === "es" ? "/recursos" : "/resources";

  // Esc dismisses (counts as "later").
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSecondary();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSecondary]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onSecondary} />
      <div className="relative bg-bg border border-border rounded-xl p-6 max-w-md w-full shadow-2xl">
        <h2 className="font-display text-2xl text-text mb-2">{t("title")}</h2>
        <p className="text-text-muted text-sm mb-5">{t("body")}</p>

        {/* "There's more" footer block — links to the resources hub. */}
        <div className="border-t border-border pt-4 mb-6">
          <p className="text-xs text-text-muted leading-relaxed mb-3">
            {t("more")}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={resourcesHref}
              onClick={onSecondary}
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs text-text border border-border bg-surface hover:border-accent transition-colors"
            >
              {t("resourcesLink")}
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onSecondary}
            className="text-sm text-text-muted hover:text-text"
          >
            {t("secondary")}
          </button>
          <button
            type="button"
            onClick={onPrimary}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-bg font-medium text-sm hover:opacity-90 transition-opacity"
          >
            {t("primary")}
          </button>
        </div>
      </div>
    </div>
  );
}
