"use client";

import { useTranslations } from "next-intl";
import SectionContainer from "./primitives/SectionContainer";
import AnimatedHeadline from "./primitives/AnimatedHeadline";

type CompareRow = { others: string; us: string };

export default function Diagnosis() {
  const t = useTranslations("landing.diagnosis");
  const rows = t.raw("compare.rows") as CompareRow[];

  return (
    <SectionContainer id="diagnosis" surface="navy">
      <div className="max-w-4xl mx-auto text-center">
        <AnimatedHeadline
          text={t("headline")}
          className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight font-light text-ls-text-primary"
        />

        <div className="mt-12 space-y-5 text-lg text-ls-text-secondary leading-relaxed max-w-2xl mx-auto">
          {(["p1", "p2", "p3"] as const).map((key) => (
            <p key={key} className="ls-reveal">
              {t(key)}
            </p>
          ))}
          <p className="ls-reveal font-display text-2xl sm:text-3xl text-ls-text-primary pt-4">
            {t("p4")}
          </p>
        </div>
      </div>

      {/* Comparison table */}
      <div className="ls-reveal mt-20 grid sm:grid-cols-2 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden max-w-3xl mx-auto">
        <div className="bg-ls-navy">
          <div className="px-6 py-4 border-b border-white/10 text-xs uppercase tracking-wider text-ls-text-secondary">
            {t("compare.othersTitle")}
          </div>
          <ul className="divide-y divide-white/5">
            {rows.map((r) => (
              <li
                key={r.others}
                className="px-6 py-4 text-ls-text-secondary line-through decoration-ls-text-secondary/40"
              >
                {r.others}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-ls-indigo">
          <div className="px-6 py-4 border-b border-white/10 text-xs uppercase tracking-wider text-ls-ochre flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ls-ochre" />
            {t("compare.usTitle")}
          </div>
          <ul className="divide-y divide-white/5">
            {rows.map((r) => (
              <li
                key={r.us}
                className="px-6 py-4 text-ls-text-primary font-medium"
              >
                {r.us}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionContainer>
  );
}
