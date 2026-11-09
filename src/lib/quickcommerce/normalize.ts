import type { PlatformId } from "@/config/platforms";
import type { ApiItem, ApiPlatformInfo, ApiSearchProduct, Offer, ProductDetail } from "./types";
import { etaToMinutes, unitPrice } from "./units";

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function toText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function discount(price: number, mrp: number | null): number {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

function platformInfo(raw: ApiSearchProduct["platform"]): ApiPlatformInfo {
  return raw && typeof raw === "object" ? raw : {};
}

function buildOffer(
  platform: PlatformId,
  fields: {
    id: string;
    name: string | null;
    brand: string | null;
    images: string[];
    quantity: string | null;
    price: number | null;
    mrp: number | null;
    available: boolean | null | undefined;
    inventory: number | null;
    rating: number | null;
    ratingCount: number | null;
    deeplink: string | null;
    eta: string | number | null | undefined;
    open: boolean | null | undefined;
  },
): Offer | null {
  const price = fields.price ?? fields.mrp;
  if (!fields.name || price === null || price <= 0) return null;

  const mrp = fields.mrp && fields.mrp >= price ? fields.mrp : null;
  const etaMinutes = etaToMinutes(fields.eta);
  const images = fields.images.filter((src) => /^https?:\/\//.test(src));

  return {
    key: `${platform}:${fields.id}`,
    platform,
    productId: fields.id,
    name: fields.name,
    brand: fields.brand,
    image: images[0] ?? null,
    images,
    quantity: fields.quantity,
    price,
    mrp,
    discountPercent: discount(price, mrp),
    available: fields.available ?? (fields.inventory === null ? true : fields.inventory > 0),
    inventory: fields.inventory,
    rating: fields.rating && fields.rating > 0 ? Math.round(fields.rating * 10) / 10 : null,
    ratingCount: fields.ratingCount,
    deeplink: fields.deeplink,
    eta:
      typeof fields.eta === "number" ? `${fields.eta} mins` : (toText(fields.eta ?? null) ?? null),
    etaMinutes,
    storeOpen: fields.open ?? null,
    unitPrice: unitPrice(price, fields.quantity),
  };
}

export function normalizeSearchProduct(
  platform: PlatformId,
  raw: ApiSearchProduct,
): Offer | null {
  const info = platformInfo(raw.platform);
  return buildOffer(platform, {
    id: String(raw.id),
    name: toText(raw.name),
    brand: toText(raw.brand),
    images: raw.images ?? (raw.image ? [raw.image] : []),
    quantity: toText(raw.quantity),
    price: toNumber(raw.offer_price) ?? toNumber(raw.price),
    mrp: toNumber(raw.mrp),
    available: raw.available,
    inventory: toNumber(raw.inventory),
    rating: toNumber(raw.rating),
    ratingCount: toNumber(raw.rating_count),
    deeplink: toText(raw.deeplink),
    eta: info.sla,
    open: info.open,
  });
}

/** Keys rendered elsewhere on the product page, excluded from "more details". */
const KNOWN_ITEM_KEYS = new Set([
  "item_id",
  "id",
  "name",
  "brand",
  "quantity",
  "available",
  "price",
  "offer_price",
  "mrp",
  "inventory",
  "deeplink",
  "rating",
  "rating_count",
  "platform",
  "store_id",
  "fetched_at",
  "gallery",
  "images",
  "image",
  "currency",
  "lat",
  "lon",
]);

function humanise(key: string): string {
  return key.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function normalizeItem(
  platform: PlatformId,
  raw: ApiItem,
  fallbackEta?: string | null,
): ProductDetail | null {
  const info = typeof raw.platform === "object" && raw.platform ? raw.platform : {};
  const offer = buildOffer(platform, {
    id: String(raw.item_id),
    name: toText(raw.name),
    brand: toText(raw.brand),
    images: raw.gallery?.length ? raw.gallery : (raw.images ?? []),
    quantity: toText(raw.quantity),
    price: toNumber(raw.price) ?? toNumber(raw.offer_price),
    mrp: toNumber(raw.mrp),
    available: raw.available,
    inventory: toNumber(raw.inventory),
    rating: toNumber(raw.rating),
    ratingCount: toNumber(raw.rating_count),
    deeplink: toText(raw.deeplink),
    eta: info.sla ?? fallbackEta,
    open: info.open,
  });
  if (!offer) return null;

  const attributes = Object.entries(raw)
    .filter(([key, value]) => !KNOWN_ITEM_KEYS.has(key) && isDisplayable(value))
    .map(([key, value]) => ({ label: humanise(key), value: String(value) }));

  return {
    ...offer,
    storeId: toText(raw.store_id ?? null),
    fetchedAt: toText(raw.fetched_at ?? null),
    variants: [],
    attributes,
  };
}

function isDisplayable(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0 && value.length < 400;
  return typeof value === "number" || typeof value === "boolean";
}
