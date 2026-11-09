import type { PlatformId } from "@/config/platforms";

/** Product page URL. Carrying the search query lets comparisons reuse cached results. */
export function productHref(platform: PlatformId, productId: string, query?: string): string {
  const base = `/product/${platform}/${encodeURIComponent(productId)}`;
  return query ? `${base}?q=${encodeURIComponent(query)}` : base;
}

export function searchHref(query: string): string {
  return `/search?q=${encodeURIComponent(query)}`;
}
