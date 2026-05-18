"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import SectionContainer from "../primitives/SectionContainer";
import AnimatedHeadline from "../primitives/AnimatedHeadline";
import FeatureRow from "./FeatureRow";
import ForcedClosureDemo from "./ForcedClosureDemo";
import AIChatDemo from "./AIChatDemo";
import ResumeContextDemo from "./ResumeContextDemo";
import NotificationsDemo from "./NotificationsDemo";
import FrictionDemo from "./FrictionDemo";
import SundayReviewDemo from "./SundayReviewDemo";

export default function FeaturesSection() {
  const t = useTranslations("landing.features");

  return (
    <SectionContainer id="features" surface="navy">
      <div className="max-w-3xl mx-auto text-center mb-24">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-5 inline-block text-xs font-medium uppercase tracking-[0.2em] text-ls-ochre"
        >
          {t("intro.eyebrow")}
        </motion.p>
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
