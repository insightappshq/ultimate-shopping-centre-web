/**
 * CDNs that platform product images are served from. Images on these hosts go
 * through the Next.js image optimizer; anything else is rendered as-is so an
 * unexpected CDN never shows a broken image.
 */
export const OPTIMIZED_IMAGE_HOSTS = [
  "cdn.grofers.com",
  "*.zeptonow.com",
  "*.zepto.co.in",
  "instamart-media-assets.swiggy.com",
  "media-assets.swiggy.com",
  "*.bbassets.com",
  "www.bigbasket.com",
  "*.jiomart.com",
  "*.jiomartjcp.com",
  "cdn.pixelbin.io",
  "*.dmart.in",
  "m.media-amazon.com",
  "images-eu.ssl-images-amazon.com",
] as const;

export function isOptimizedImageHost(src: string): boolean {
  let host: string;
  try {
    host = new URL(src).hostname;
  } catch {
    return false;
  }
  return OPTIMIZED_IMAGE_HOSTS.some((pattern) =>
    pattern.startsWith("*.") ? host.endsWith(pattern.slice(1)) : host === pattern,
  );
}
