"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import SectionContainer from "../primitives/SectionContainer";
import AnimatedHeadline from "../primitives/AnimatedHeadline";
import FeatureRow from "./FeatureRow";

// The demos are the only framer-motion users left on the landing page. Loading
// them with next/dynamic (ssr:false) code-splits framer + each demo into their
// own client chunks, so framer never lands in the page's critical bundle — it's
// fetched lazily as the user scrolls down to Features. The skeleton reserves
// height to avoid layout shift while the chunk loads.
function DemoSkeleton() {
  return (
    <div className="min-h-[360px] rounded-2xl border border-white/10 bg-white/[0.02]" />
  );
}

// next/dynamic requires the options to be an inline object literal (the SWC
// transform reads them statically), so we can't share a `demoOpts` constant.
const ForcedClosureDemo = dynamic(() => import("./ForcedClosureDemo"), {
  ssr: false,
  loading: () => <DemoSkeleton />,
});
const AIChatDemo = dynamic(() => import("./AIChatDemo"), {
  ssr: false,
  loading: () => <DemoSkeleton />,
});
const ResumeContextDemo = dynamic(() => import("./ResumeContextDemo"), {
  ssr: false,
  loading: () => <DemoSkeleton />,
});
const NotificationsDemo = dynamic(() => import("./NotificationsDemo"), {
  ssr: false,
  loading: () => <DemoSkeleton />,
});
const FrictionDemo = dynamic(() => import("./FrictionDemo"), {
  ssr: false,
  loading: () => <DemoSkeleton />,
});
const SundayReviewDemo = dynamic(() => import("./SundayReviewDemo"), {
  ssr: false,
  loading: () => <DemoSkeleton />,
});

export default function FeaturesSection() {
  const t = useTranslations("landing.features");

  return (
    <SectionContainer id="features" surface="navy">
      <div className="max-w-3xl mx-auto text-center mb-24">
        <p className="ls-reveal mb-5 inline-block text-xs font-medium uppercase tracking-[0.2em] text-ls-ochre">
          {t("intro.eyebrow")}
        </p>
        <AnimatedHeadline
          text={t("intro.headline")}
          className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight font-light text-ls-text-primary"
        />
      </div>

      <div className="space-y-32 sm:space-y-40">
        <FeatureRow
          id="feature-forced-closure"
          label={t("forcedClosure.label")}
          headline={t("forcedClosure.headline")}
          body={t("forcedClosure.body")}
          demo={<ForcedClosureDemo />}
        />

        <FeatureRow
          id="feature-ai-chat"
          label={t("aiChat.label")}
          headline={t("aiChat.headline")}
          body={t("aiChat.body")}
          closing={t("aiChat.closing")}
          demo={<AIChatDemo />}
          reverse
        />

        <FeatureRow
          id="feature-resume-context"
          label={t("resumeContext.label")}
          headline={t("resumeContext.headline")}
          body={t("resumeContext.body")}
          closing={t("resumeContext.closing")}
          demo={<ResumeContextDemo />}
        />

        <FeatureRow
          id="feature-notifications"
          label={t("notifications.label")}
          headline={t("notifications.headline")}
          body={t("notifications.body")}
          closing={t("notifications.closing")}
          demo={<NotificationsDemo />}
          reverse
        />

        <FeatureRow
          id="feature-friction"
          label={t("friction.label")}
          headline={t("friction.headline")}
          body={t("friction.body")}
          closing={t("friction.closing")}
          demo={<FrictionDemo />}
        />

        <FeatureRow
          id="feature-sunday-review"
          label={t("sundayReview.label")}
          headline={t("sundayReview.headline")}
          body={t("sundayReview.body")}
          closing={t("sundayReview.closing")}
          demo={<SundayReviewDemo />}
          reverse
        />
      </div>
    </SectionContainer>
  );
}
