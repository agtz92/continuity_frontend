"use client";

import { useEffect } from "react";

/**
 * Sets `<html lang>` on the client for statically-rendered locale subtrees.
 *
 * The root layout is static and emits `lang="en"` for everyone. The `/es`
 * marketing pages render this to correct the attribute after hydration.
 * Crawlers also get the right signal from the `hreflang` alternates in each
 * page's metadata, so SEO doesn't depend on this runtime fix.
 */
export default function SetHtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
