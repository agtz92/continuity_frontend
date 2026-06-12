/**
 * Inline script string injected into <head> on every SSR render.
 *
 * Runs synchronously before React hydrates. Three jobs:
 *   1. If the cookie says "system", resolve to the OS-effective theme
 *      (light/dark) and set data-theme on <html> so the first paint matches.
 *   2. Apply the user's palette (data-palette) from the NEXT_PALETTE cookie.
 *      The root layout is static and no longer reads cookies server-side, so
 *      this is the only place the tool's palette gets applied before paint.
 *   3. Subscribe to `prefers-color-scheme` so users on "system" see the app
 *      update live when the OS theme changes.
 *
 * The cookie is the source of truth; we read it directly here because
 * server-side we can't know `prefers-color-scheme` (and the static root layout
 * intentionally avoids cookies). Marketing pages ignore both attributes (they
 * paint from the fixed `[data-surface="marketing"]` brand tokens), so applying
 * defaults there is harmless.
 */
export const NO_FLASH_SCRIPT = `
(function () {
  try {
    var COOKIE = 'NEXT_THEME';
    var PALETTE_COOKIE = 'NEXT_PALETTE';
    function read(name, fallback) {
      var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[1]) : fallback;
    }
    function readCookie() {
      return read(COOKIE, 'system');
    }
    function effective(pref) {
      if (pref === 'system' || !pref) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return pref;
    }
    function apply() {
      document.documentElement.setAttribute('data-theme', effective(readCookie()));
      document.documentElement.setAttribute('data-palette', read(PALETTE_COOKIE, 'default'));
    }
    apply();
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var listener = function () { if (readCookie() === 'system') apply(); };
    if (mq.addEventListener) mq.addEventListener('change', listener);
    else if (mq.addListener) mq.addListener(listener);
  } catch (e) {}
})();
`;
