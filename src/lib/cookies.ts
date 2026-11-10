/**
 * Lee una cookie del navegador por nombre. Devuelve `null` en server o si no existe.
 *
 * Sin `RegExp` a propósito: armar la regex con el nombre dispara la regla de Semgrep
 * `detect-non-literal-regexp` y no aporta nada sobre un split simple.
 */
export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = name + "=";
  for (const part of document.cookie.split("; ")) {
    if (part.startsWith(prefix)) {
      const value = part.slice(prefix.length);
      return value ? decodeURIComponent(value) : null;
    }
  }
  return null;
}
