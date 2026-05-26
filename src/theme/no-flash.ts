/**
 * Inline script string injected into <head> on every SSR render.
 *
 * Runs synchronously before React hydrates. Two jobs:
 *   1. If the cookie says "system", resolve to the OS-effective theme
 *      (light/dark) and set data-theme on <html> so the first paint matches.
 *   2. Subscribe to `prefers-color-scheme` so users on "system" see the app
 *      update live when the OS theme changes.
 *
 * The cookie is the source of truth; we read it directly here because
 * server-side we can't know `prefers-color-scheme`.
 */
export const NO_FLASH_SCRIPT = `
(function () {
  try {
    var COOKIE = 'NEXT_THEME';
    function readCookie() {
      var match = document.cookie.match(new RegExp('(?:^|; )' + COOKIE + '=([^;]+)'));
      return match ? decodeURIComponent(match[1]) : 'system';
    }
    function effective(pref) {
      if (pref === 'system' || !pref) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return pref;
    }
    function apply() {
      document.documentElement.setAttribute('data-theme', effective(readCookie()));
    }
    apply();
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var listener = function () { if (readCookie() === 'system') apply(); };
    if (mq.addEventListener) mq.addEventListener('change', listener);
    else if (mq.addListener) mq.addListener(listener);
  } catch (e) {}
})();
`;
