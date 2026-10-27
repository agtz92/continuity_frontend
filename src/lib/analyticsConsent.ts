/**
 * Consentimiento de analítica (Google Analytics) en el sitio público.
 *
 * La decisión vive en localStorage — no en una cookie — para que las páginas de
 * marketing sigan siendo estáticas: el servidor nunca la lee. Sin decisión
 * guardada GA no se carga; `null` significa "todavía no ha contestado" y es lo
 * que hace aparecer el banner.
 */

export type AnalyticsConsent = "granted" | "denied";

const STORAGE_KEY = "continuity:analytics-consent";
const CHANGE_EVENT = "continuity:analytics-consent";
const REOPEN_EVENT = "continuity:analytics-consent-reopen";

export function readConsent(): AnalyticsConsent | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function writeConsent(value: AnalyticsConsent): void {
  const previous = readConsent();
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage bloqueado: la decisión dura solo esta visita.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));

  // gtag no se puede descargar de la página: al retirar el consentimiento se
  // borran sus cookies y se recarga para que no siga midiendo esta visita.
  if (previous === "granted" && value === "denied") {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    w.gtag?.("consent", "update", { analytics_storage: "denied" });
    clearAnalyticsCookies();
    window.location.reload();
  }
}

export function subscribeConsent(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Vuelve a mostrar el banner (enlace "Preferencias de cookies" del footer). */
export function reopenConsent(): void {
  window.dispatchEvent(new Event(REOPEN_EVENT));
}

export function subscribeReopen(onReopen: () => void): () => void {
  window.addEventListener(REOPEN_EVENT, onReopen);
  return () => window.removeEventListener(REOPEN_EVENT, onReopen);
}

/** Borra `_ga` y `_ga_<id>` en el host y en cada dominio padre (GA usa `.continuu.it`). */
export function clearAnalyticsCookies(): void {
  const names = document.cookie
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter((name) => name === "_ga" || name.startsWith("_ga_") || name === "_gid");
  const parts = window.location.hostname.split(".");
  const domains = [""];
  for (let i = 0; i < parts.length - 1; i++) {
    domains.push(`; domain=.${parts.slice(i).join(".")}`);
  }
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
    }
  }
}
