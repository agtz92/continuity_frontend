/**
 * Prepare CMS `content_html` for rendering on the public site.
 *
 * The body comes from the editor as raw HTML injected via
 * `dangerouslySetInnerHTML`, so we can't wrap each `<img>` in `next/image`.
 * Instead we make every inline image **lazy + async-decoded** so the browser
 * defers off-screen images (big win on mobile, where a long article would
 * otherwise download every image up front before the page settles).
 *
 * Idempotent: images that already declare `loading`/`decoding` are left alone.
 */
export function lazyLoadContentImages(html: string): string {
  if (!html) return html;
  return html.replace(/<img\b([^>]*?)\s*\/?>/gi, (match, attrs: string) => {
    let next = attrs;
    if (!/\bloading\s*=/.test(next)) next += ' loading="lazy"';
    if (!/\bdecoding\s*=/.test(next)) next += ' decoding="async"';
    return `<img${next}>`;
  });
}
