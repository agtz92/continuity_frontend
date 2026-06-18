"use client";

import type { ReactNode } from "react";
import AnimatedHeadline from "../primitives/AnimatedHeadline";

type Props = {
  label: string;
  headline: string;
  body: string;
  closing?: string;
  demo: ReactNode;
  reverse?: boolean;
  id?: string;
};

export default function FeatureRow({
  label,
  headline,
  body,
  closing,
  demo,
  reverse = false,
  id,
}: Props) {
  return (
    <article
      id={id}
      className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center"
    >
      <div className={`lg:col-span-5 ${reverse ? "lg:order-2" : ""}`}>
        <span className="ls-reveal inline-block text-xs font-medium uppercase tracking-[0.2em] text-ls-ochre mb-5">
          {label}
        </span>
        <AnimatedHeadline
          text={headline}
          className="font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight font-light text-ls-text-primary"
        />
        <p className="ls-reveal mt-6 text-lg text-ls-text-secondary leading-relaxed">
          {body}
        </p>
        {closing ? (
          <p className="ls-reveal mt-6 text-base text-ls-ochre/90 font-medium italic">
            {closing}
          </p>
        ) : null}
      </div>

      <div className={`ls-reveal lg:col-span-7 ${reverse ? "lg:order-1" : ""}`}>
        {demo}
      </div>
    </article>
  );
}
