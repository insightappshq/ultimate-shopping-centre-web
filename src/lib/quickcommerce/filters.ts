import { z } from "zod";
import { PLATFORM_IDS, isPlatformId, type PlatformId } from "@/config/platforms";
import { effectivePrice, groupOffers } from "./matching";
import type { Offer, ProductGroup } from "./types";

/**
 * Search filters map onto what QuickCommerce returns:
 * - `platforms` selects which platforms are queried upstream;
 * - everything else (price, brand, stock, rating, discount, ETA) is applied to
 *   the normalised listings, so changing a filter never costs extra credits.
 */
export const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "unit_price", label: "Best value (per unit)" },
  { value: "discount", label: "Biggest discount" },
  { value: "rating", label: "Top rated" },
  { value: "eta", label: "Fastest delivery" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const DISCOUNT_OPTIONS = [10, 25, 40] as const;
export const RATING_OPTIONS = [4, 3.5, 3] as const;
export const ETA_OPTIONS = [
  { value: 15, label: "Under 15 mins" },
  { value: 30, label: "Under 30 mins" },
  { value: 120, label: "Under 2 hours" },
] as const;

const csv = z
  .string()
  .optional()
  .transform((value) => (value ? value.split(",").map((v) => v.trim()).filter(Boolean) : []));

const positiveNumber = z.coerce.number().positive().optional().catch(undefined);

export const searchParamsSchema = z.object({
  q: z.string().trim().max(120).default(""),
  platforms: csv.transform((ids) => {
    const valid = ids.filter(isPlatformId);
    return valid.length ? valid : [...PLATFORM_IDS];
  }),
  brands: csv,
  sort: z.enum(SORT_OPTIONS.map((o) => o.value) as [SortOption, ...SortOption[]]).catch("relevance").default("relevance"),
  minPrice: positiveNumber,
  maxPrice: positiveNumber,
  minRating: positiveNumber,
  minDiscount: positiveNumber,
  maxEta: positiveNumber,
  inStock: z
    .enum(["1", "0"])
    .optional()
    .transform((v) => v === "1"),
  view: z.enum(["grouped", "list"]).catch("grouped").default("grouped"),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});

export type SearchFilters = z.infer<typeof searchParamsSchema>;

type RawParams = Record<string, string | string[] | undefined>;

export function parseSearchParams(params: RawParams): SearchFilters {
  const flat = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
  return searchParamsSchema.parse(flat);
}

export function applyFilters(offers: Offer[], filters: SearchFilters): Offer[] {
  const brands = new Set(filters.brands.map((b) => b.toLowerCase()));
  return offers.filter((offer) => {
    if (filters.inStock && !offer.available) return false;
    if (filters.minPrice !== undefined && offer.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && offer.price > filters.maxPrice) return false;
    if (brands.size && !brands.has((offer.brand ?? "").toLowerCase())) return false;
    if (filters.minRating !== undefined && (offer.rating ?? 0) < filters.minRating) return false;
    if (filters.minDiscount !== undefined && offer.discountPercent < filters.minDiscount) return false;
    if (filters.maxEta !== undefined && (offer.etaMinutes ?? Infinity) > filters.maxEta) return false;
    return true;
  });
}

function compareBy(sort: SortOption) {
  return (a: Offer, b: Offer): number => {
    switch (sort) {
      case "price_asc":
        return effectivePrice(a) - effectivePrice(b);
      case "price_desc":
        return b.price - a.price;
      case "unit_price":
        return (a.unitPrice?.value ?? Infinity) - (b.unitPrice?.value ?? Infinity);
      case "discount":
        return b.discountPercent - a.discountPercent;
      case "rating":
        return (b.rating ?? 0) - (a.rating ?? 0) || (b.ratingCount ?? 0) - (a.ratingCount ?? 0);
      case "eta":
        return (a.etaMinutes ?? Infinity) - (b.etaMinutes ?? Infinity);
      default:
        return 0;
    }
  };
}

export function sortOffers(offers: Offer[], sort: SortOption): Offer[] {
  return sort === "relevance" ? offers : [...offers].sort(compareBy(sort));
}

export function sortGroups(groups: ProductGroup[], sort: SortOption): ProductGroup[] {
  if (sort === "relevance") {
    // Products available on more platforms are more useful to compare.
    return [...groups].sort((a, b) => b.offers.length - a.offers.length);
  }
  const compare = compareBy(sort);
  return [...groups].sort((a, b) => compare(a.best, b.best));
}

export interface SearchFacets {
  brands: { value: string; count: number }[];
  priceRange: { min: number; max: number } | null;
  platformCounts: Partial<Record<PlatformId, number>>;
}

export function buildFacets(offers: Offer[]): SearchFacets {
  const brandCounts = new Map<string, number>();
  const platformCounts: Partial<Record<PlatformId, number>> = {};
  let min = Infinity;
  let max = 0;

  for (const offer of offers) {
    if (offer.brand) brandCounts.set(offer.brand, (brandCounts.get(offer.brand) ?? 0) + 1);
    platformCounts[offer.platform] = (platformCounts[offer.platform] ?? 0) + 1;
    min = Math.min(min, offer.price);
    max = Math.max(max, offer.price);
  }

  return {
    brands: [...brandCounts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
      .slice(0, 24),
    priceRange: offers.length ? { min: Math.floor(min), max: Math.ceil(max) } : null,
    platformCounts,
  };
}

export const PAGE_SIZE = 24;

export interface FilteredResults {
  total: number;
  page: number;
  pageCount: number;
  groups: ProductGroup[];
  offers: Offer[];
}

/** Applies filters, grouping, sorting and pagination in one pass. */
export function shapeResults(all: Offer[], filters: SearchFilters): FilteredResults {
  const filtered = applyFilters(all, filters);

  if (filters.view === "list") {
    const sorted = sortOffers(filtered, filters.sort);
    const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const page = Math.min(filters.page, pageCount);
    return {
      total: sorted.length,
      page,
      pageCount,
      groups: [],
      offers: sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    };
  }

  const groups = sortGroups(groupOffers(filtered), filters.sort);
  const pageCount = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  return {
    total: groups.length,
    page,
    pageCount,
    groups: groups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    offers: [],
  };
}

/** Serialises filters back into a URLSearchParams string, omitting defaults. */
export function filtersToQuery(filters: Partial<SearchFilters>): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.platforms?.length && filters.platforms.length < PLATFORM_IDS.length) {
    params.set("platforms", filters.platforms.join(","));
  }
  if (filters.brands?.length) params.set("brands", filters.brands.join(","));
  if (filters.sort && filters.sort !== "relevance") params.set("sort", filters.sort);
  if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.minRating) params.set("minRating", String(filters.minRating));
  if (filters.minDiscount) params.set("minDiscount", String(filters.minDiscount));
  if (filters.maxEta) params.set("maxEta", String(filters.maxEta));
  if (filters.inStock) params.set("inStock", "1");
  if (filters.view && filters.view !== "grouped") params.set("view", filters.view);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  return params.toString();
}
