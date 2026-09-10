/**
 * Inline script string injected into <head> on every SSR render.
 *
 * Runs synchronously before React hydrates. Four jobs:
 *   1. If the cookie says "system", resolve to the OS-effective theme
 *      (carbon/light) and set data-theme on <html> so the first paint matches.
 *   2. Apply the user's palette (data-palette) from the NEXT_PALETTE cookie.
 *      The root layout is static and no longer reads cookies server-side, so
 *      this is the only place the tool's palette gets applied before paint.
 *   3. Normalize the retired theme and palette names to their current
 *      equivalent, so a cookie written before the redesign paints the right
 *      thing. The generated CSS also matches the old names on its own — this is
 *      belt and braces, and keeps the DOM attribute honest for anything that
 *      reads it (PaletteSelector, ThemeSelector).
 *   4. Subscribe to `prefers-color-scheme` so users on "system" see the app
 *      update live when the OS theme changes.
 *
 * The cookie is the source of truth; we read it directly here because
 * server-side we can't know `prefers-color-scheme` (and the static root layout
 * intentionally avoids cookies). Marketing pages ignore both attributes (they
 * paint from the fixed `[data-surface="marketing"]` brand tokens), so applying
 * defaults there is harmless.
 *
 * Los mapas de abajo son copia literal de LEGACY_THEME_MAP y
 * LEGACY_PALETTE_MAP: este archivo es una cadena inyectada en <head> y no puede
 * importar nada. Si cambian allí, cámbialos aquí.
 */
export const NO_FLASH_SCRIPT = `
(function () {
  try {
    var COOKIE = 'NEXT_THEME';
    var PALETTE_COOKIE = 'NEXT_PALETTE';
    var LEGACY_THEME = { continuuit: 'continuu', dark: 'carbon' };
    var LEGACY_PALETTE = {
      'default': 'ocre', continuuit: 'ocre',
      green: 'salvia', turquoise: 'salvia',
      pink: 'ciruela', cute: 'ciruela', complimentary: 'ciruela',
      business: 'hielo', midnight: 'hielo', retro: 'hielo',
      neon: 'oxido', sunset: 'oxido', boho: 'oxido'
    };
    function read(name, fallback) {
      var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[1]) : fallback;
    }
    function readCookie() {
      return read(COOKIE, 'system');
    }
    function effective(pref) {
      if (pref === 'system' || !pref) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'carbon' : 'light';
      }
      return LEGACY_THEME[pref] || pref;
    }
    function apply() {
      var pal = read(PALETTE_COOKIE, 'ocre');
      document.documentElement.setAttribute('data-theme', effective(readCookie()));
      document.documentElement.setAttribute('data-palette', LEGACY_PALETTE[pal] || pal);
    }
    apply();
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var listener = function () { if (readCookie() === 'system') apply(); };
    if (mq.addEventListener) mq.addEventListener('change', listener);
    else if (mq.addListener) mq.addListener(listener);
  } catch (e) {}
})();
`;
