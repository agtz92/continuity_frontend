/**
 * Eventos de Google Analytics fuera de los page views (hoy solo `sign_up`).
 *
 * Solo se mandan con consentimiento y donde `<Analytics/>` está montado
 * (marketing, `/login` y `/onboarding`). En cualquier otra pantalla `gtag` no
 * existe y la llamada no hace nada.
 */
import { readConsent } from "@/lib/analyticsConsent";

type Gtag = (...args: unknown[]) => void;

// `gtag` lo define el script de `<Analytics/>` con `afterInteractive`: en una
// pantalla recién montada puede no existir todavía, así que se espera un poco.
const RETRY_MS = 250;
const MAX_TRIES = 20;

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || readConsent() !== "granted") return;
  let tries = 0;
  const send = () => {
    const gtag = (window as unknown as { gtag?: Gtag }).gtag;
    if (gtag) {
      gtag("event", name, params);
      return;
    }
    if (++tries < MAX_TRIES) window.setTimeout(send, RETRY_MS);
  };
  send();
}
