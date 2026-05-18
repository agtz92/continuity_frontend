"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function MarketingFooter() {
  const t = useTranslations("landing.footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ls-navy border-t border-white/5">
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-12 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <Link
              href="#top"
              className="font-display text-2xl font-medium tracking-tight text-ls-text-primary"
            >
              continuu<span className="text-ls-ochre">.</span>it
            </Link>
            <p className="mt-3 font-display italic text-ls-ochre">
              {t("tagline")}
            </p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-ls-text-secondary mb-4">
              {t("product")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#features"
                  className="text-ls-text-primary hover:text-ls-ochre transition-colors"
                >
                  {t("productLinks.features")}
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-ls-text-primary hover:text-ls-ochre transition-colors"
                >
                  {t("productLinks.pricing")}
                </a>
              </li>
              <li>
                <a
                  href="#loop-society"
                  className="text-ls-text-primary hover:text-ls-ochre transition-colors"
                >
                  {t("productLinks.loopSociety")}
                </a>
              </li>
              <li>
                <span className="text-ls-text-secondary">
                  {t("productLinks.manifesto")}
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-ls-text-secondary mb-4">
              {t("community")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-ls-text-secondary">
                  {t("communityLinks.reddit")}
                </span>
              </li>
              <li>
                <span className="text-ls-text-secondary">
                  {t("communityLinks.twitter")}
                </span>
              </li>
              <li>
                <span className="text-ls-text-secondary">
                  {t("communityLinks.newsletter")}
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-ls-text-secondary mb-4">
              {t("company")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-ls-text-primary">
                  {t("companyLinks.about")}
                </span>
              </li>
              <li>
                <a
                  href={`mailto:${t("companyLinks.contact")}`}
                  className="text-ls-text-primary hover:text-ls-ochre transition-colors"
                >
                  {t("companyLinks.contact")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-ls-text-secondary">
          <p>{t("builtBy")}</p>
          <p>{t("copyright", { year })}</p>
        </div>
      </div>
    </footer>
  );
}
