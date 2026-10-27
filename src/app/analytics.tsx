"use client";

import Script from "next/script";
import { useEffect, useSyncExternalStore } from "react";
import {
  clearAnalyticsCookies,
  readConsent,
  subscribeConsent,
} from "@/lib/analyticsConsent";

const GA_MEASUREMENT_ID = "G-9QLNMQSL0N";

/**
 * Google Analytics, solo en el sitio público y solo después de que la persona
 * acepta en el banner (`ConsentBanner`). Lo montan los layouts de marketing: la
 * app, el admin y `/oauth/consent` (que lleva state y code_challenge en la URL)
 * no cargan GA.
 *
 * Consent Mode v2: se declara analytics granted y todo lo de anuncios denied,
 * porque nunca usamos GA para publicidad.
 */
export function Analytics() {
  const consent = useSyncExternalStore(subscribeConsent, readConsent, () => null);
  // gtag puede reescribir su cookie justo antes de la recarga que sigue a
  // retirar el permiso: se vuelve a borrar en cada visita sin consentimiento.
  useEffect(() => {
    if (consent === "denied") clearAnalyticsCookies();
  }, [consent]);
  if (consent !== "granted") return null;
  return (
    <>
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
    </>
  );
}
