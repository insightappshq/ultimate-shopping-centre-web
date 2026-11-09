import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { PLATFORMS, type PlatformId } from "@/config/platforms";
import { quickCommerceConfig } from "@/lib/env";
import { uniqueBy } from "@/lib/hash";
import { QuickCommerceError, qcRequest } from "./client";
import { comparisonQuery, matchAcrossPlatforms } from "./matching";
import { mockItem, mockSearch } from "./mock";
import { normalizeItem, normalizeSearchProduct } from "./normalize";
import type {
  ApiItemData,
  ApiSearchData,
  ApiSearchProduct,
  Comparison,
  GeoLocation,
  Offer,
  PlatformStatus,
  ProductDetail,
  SearchResult,
} from "./types";

/**
 * Domain service over the QuickCommerce API.
 *
 * Each platform is searched independently and cached per
 * (query, platform, location) so that:
 *  - a slow or failing platform never blocks or poisons the others;
 *  - toggling the platform filter re-uses cached results (no extra credits);
 *  - the product page comparison re-uses the search the user just ran.
 * Failures throw inside the cached scope, so they are never cached.
 */

type LocationKey = { lat: number; lon: number; pincode: string };

/** ~100 m precision keeps cache hit-rates high without changing the store served. */
function locationKey(location: GeoLocation): LocationKey {
  return {
    lat: Math.round(location.lat * 1000) / 1000,
    lon: Math.round(location.lon * 1000) / 1000,
    pincode: location.pincode,
  };
}

function normaliseQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").toLowerCase();
}

async function searchPlatform(platform: PlatformId, query: string, loc: LocationKey): Promise<Offer[]> {
  "use cache";
  cacheLife("search");
  cacheTag("qc:search", `qc:search:${platform}`);

  const meta = PLATFORMS[platform];
  let products: ApiSearchProduct[];

  if (quickCommerceConfig().useMock) {
    products = mockSearch(platform, query);
  } else {
    const data = await qcRequest<ApiSearchData>(
      "/v1/search",
      { q: query, lat: loc.lat, lon: loc.lon, platform: meta.apiName },
      { pincode: meta.requiresPincode ? loc.pincode : undefined },
    );
    products = data.products ?? [];
  }

  const offers = products
    .map((raw) => normalizeSearchProduct(platform, raw))
    .filter((offer): offer is Offer => offer !== null);
  // Platforms occasionally repeat a listing within one response.
  return uniqueBy(offers, (offer) => offer.listingId);
}

function toStatus(platform: PlatformId, result: PromiseSettledResult<Offer[]>): PlatformStatus {
  if (result.status === "fulfilled") {
    return { platform, ok: true, count: result.value.length };
  }
  const error = result.reason;
  if (error instanceof QuickCommerceError) {
    return { platform, ok: false, count: 0, error: error.code, message: error.message };
  }
  console.error(`[quickcommerce] ${platform} search failed`, error);
  return { platform, ok: false, count: 0, error: "unknown", message: "Unexpected error" };
}

/** Round-robin merge keeps each platform's own relevance order while mixing sources. */
function interleave(lists: Offer[][]): Offer[] {
  const merged: Offer[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) {
    for (const list of lists) if (list[i]) merged.push(list[i]);
  }
  return merged;
}

export async function searchProducts(
  query: string,
  platforms: PlatformId[],
  location: GeoLocation,
): Promise<SearchResult> {
  const q = normaliseQuery(query);
  if (!q) return { query: q, offers: [], statuses: [] };

  const loc = locationKey(location);
  const settled = await Promise.allSettled(
    platforms.map((platform) => {
      if (PLATFORMS[platform].requiresPincode && !loc.pincode) {
        return Promise.reject(
          new QuickCommerceError("Add a delivery pincode to see this platform", "invalid"),
        );
      }
      return searchPlatform(platform, q, loc);
    }),
  );

  return {
    query: q,
    offers: interleave(settled.map((r) => (r.status === "fulfilled" ? r.value : []))),
    statuses: platforms.map((platform, i) => toStatus(platform, settled[i])),
  };
}

async function fetchItem(platform: PlatformId, itemId: string, loc: LocationKey): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("product");
  cacheTag("qc:item", `qc:item:${platform}:${itemId}`);

  const meta = PLATFORMS[platform];
  let items: ApiItemData["items"];

  if (quickCommerceConfig().useMock) {
    const item = mockItem(platform, itemId);
    items = item ? [item] : [];
  } else {
    try {
      const data = await qcRequest<ApiItemData>(
        "/v1/item",
        { item_id: itemId, lat: loc.lat, lon: loc.lon, platform: meta.apiName },
        { pincode: meta.requiresPincode ? loc.pincode : undefined },
      );
      items = data.items ?? [];
    } catch (error) {
      if (error instanceof QuickCommerceError && error.code === "not_found") return null;
      throw error;
    }
  }

  const [primary, ...rest] = (items ?? [])
    .map((raw) => normalizeItem(platform, raw))
    .filter((item): item is ProductDetail => item !== null);
  if (!primary) return null;

  // Variants can share the primary's item id (e.g. Instamart pack sizes).
  const variants = uniqueBy(rest, (v) => v.listingId).filter((v) => v.listingId !== primary.listingId);
  return { ...primary, variants };
}

export async function getProduct(
  platform: PlatformId,
  itemId: string,
  location: GeoLocation,
): Promise<ProductDetail | null> {
  return fetchItem(platform, itemId, locationKey(location));
}

/**
 * Finds the same product on every platform. When the user arrived from a
 * search, `searchQuery` is that query, so comparison is served from cache.
 */
export async function compareProduct(
  reference: Offer,
  location: GeoLocation,
  options: { searchQuery?: string; platforms?: PlatformId[] } = {},
): Promise<Comparison> {
  const platforms = options.platforms ?? (Object.keys(PLATFORMS) as PlatformId[]);
  const primaryQuery = options.searchQuery?.trim() || comparisonQuery(reference);

  let result = await searchProducts(primaryQuery, platforms, location);
  let { rows, related } = matchAcrossPlatforms(reference, result.offers);

  // The original search may have been broad ("milk"); retry the platforms that
  // found nothing comparable with a precise, product-specific query.
  const found = new Set(rows.map((row) => row.offer.platform));
  const retry = platforms.filter((p) => !found.has(p) && result.statuses.find((s) => s.platform === p)?.ok);
  const specificQuery = comparisonQuery(reference);
  if (retry.length && options.searchQuery && normaliseQuery(specificQuery) !== normaliseQuery(primaryQuery)) {
    const second = await searchProducts(specificQuery, retry, location);
    const merged = matchAcrossPlatforms(reference, [...result.offers, ...second.offers]);
    rows = merged.rows;
    related = merged.related;
    result = {
      ...result,
      statuses: result.statuses.map((s) => second.statuses.find((t) => t.platform === s.platform) ?? s),
    };
  }

  const matched = new Set(rows.map((row) => row.offer.platform));
  return {
    reference,
    rows,
    related,
    missing: platforms.filter((p) => !matched.has(p)),
    statuses: result.statuses,
  };
}
