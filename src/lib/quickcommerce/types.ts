import type { PlatformId } from "@/config/platforms";

/* -------------------------------------------------------------------------- */
/* Raw QuickCommerce API shapes (https://quickcommerceapi.com/docs)            */
/* Fields are optional/nullable because upstream platforms vary in coverage.   */
/* -------------------------------------------------------------------------- */

export interface ApiEnvelope<T> {
  status?: "success" | "error" | string;
  request_id?: string;
  credits_remaining?: number;
  message?: string;
  error?: string | { code?: string; message?: string };
  data?: T;
}

export interface ApiPlatformInfo {
  name?: string;
  sla?: string | number | null;
  open?: boolean | null;
  icon?: string | null;
}

export interface ApiSearchProduct {
  id: string | number;
  name?: string | null;
  brand?: string | null;
  available?: boolean | null;
  images?: string[] | null;
  image?: string | null;
  mrp?: number | string | null;
  offer_price?: number | string | null;
  price?: number | string | null;
  quantity?: string | null;
  deeplink?: string | null;
  rating?: number | string | null;
  rating_count?: number | string | null;
  inventory?: number | string | null;
  currency?: string;
  platform?: ApiPlatformInfo | string;
}

export interface ApiSearchData {
  query: string;
  platform: string;
  lat: number;
  lon: number;
  total_results?: number;
  products?: ApiSearchProduct[];
}

export interface ApiItem {
  item_id: string | number;
  name?: string | null;
  brand?: string | null;
  quantity?: string | null;
  available?: boolean | null;
  price?: number | string | null;
  offer_price?: number | string | null;
  mrp?: number | string | null;
  inventory?: number | string | null;
  deeplink?: string | null;
  rating?: number | string | null;
  rating_count?: number | string | null;
  platform?: string | ApiPlatformInfo;
  store_id?: string | null;
  fetched_at?: string | null;
  gallery?: string[] | null;
  images?: string[] | null;
  currency?: string;
  [extra: string]: unknown;
}

export interface ApiItemData {
  item_id: string;
  platform: string;
  count?: number;
  items?: ApiItem[];
}

export interface ApiEtaData {
  platform: string;
  eta?: string | number | null;
  open?: boolean | null;
  store_id?: string | null;
  url?: string | null;
}

/* -------------------------------------------------------------------------- */
/* Domain model used throughout the app                                       */
/* -------------------------------------------------------------------------- */

export interface GeoLocation {
  label: string;
  lat: number;
  lon: number;
  pincode: string;
}

export interface UnitPrice {
  /** Human label, e.g. "100 g". */
  per: string;
  value: number;
}

/** One product listing on one platform. */
export interface Offer {
  /** `${platform}:${productId}`, unique across the app. */
  key: string;
  platform: PlatformId;
  productId: string;
  name: string;
  brand: string | null;
  image: string | null;
  images: string[];
  quantity: string | null;
  price: number;
  mrp: number | null;
  /** Whole-number discount vs MRP (0 when unknown). */
  discountPercent: number;
  available: boolean;
  inventory: number | null;
  rating: number | null;
  ratingCount: number | null;
  deeplink: string | null;
  eta: string | null;
  etaMinutes: number | null;
  storeOpen: boolean | null;
  unitPrice: UnitPrice | null;
}

export interface ProductDetail extends Offer {
  storeId: string | null;
  fetchedAt: string | null;
  /** Other pack sizes returned by the platform (e.g. Instamart variants). */
  variants: Offer[];
  /** Any additional scalar attributes returned by the API. */
  attributes: { label: string; value: string }[];
}

export type PlatformErrorCode =
  | "unauthorized"
  | "no_credits"
  | "not_found"
  | "unavailable"
  | "invalid"
  | "rate_limited"
  | "upstream"
  | "timeout"
  | "unknown";

export interface PlatformStatus {
  platform: PlatformId;
  ok: boolean;
  count: number;
  error?: PlatformErrorCode;
  message?: string;
}

export interface SearchResult {
  query: string;
  offers: Offer[];
  statuses: PlatformStatus[];
}

/** Listings for the same product grouped across platforms. */
export interface ProductGroup {
  id: string;
  name: string;
  brand: string | null;
  quantity: string | null;
  image: string | null;
  offers: Offer[];
  best: Offer;
  /** Highest available price in the group, for "save up to" messaging. */
  highestPrice: number;
  maxDiscount: number;
  rating: number | null;
  fastestEtaMinutes: number | null;
}

export interface ComparisonRow {
  offer: Offer;
  /** 0..1 similarity to the reference product. */
  score: number;
  match: "exact" | "similar";
}

export interface Comparison {
  reference: Offer;
  rows: ComparisonRow[];
  /** Platforms that were searched but had no comparable listing. */
  missing: PlatformId[];
  statuses: PlatformStatus[];
  related: Offer[];
}
