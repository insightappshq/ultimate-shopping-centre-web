import type { PlatformId } from "@/config/platforms";
import { shortHash } from "@/lib/hash";
import type {
  ApiItem,
  ApiPlatformInfo,
  ApiSearchProduct,
  Offer,
  ProductDetail,
  ProductInfo,
  ProductSpec,
} from "./types";
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

/**
 * Platforms return images either as URL strings or as media objects like
 * `{ type: "image", url, thumbnail_url }`. Accept both; skip videos and junk.
 */
export function extractImages(...sources: unknown[]): string[] {
  const urls: string[] = [];
  for (const source of sources) {
    const list = Array.isArray(source) ? source : source ? [source] : [];
    for (const entry of list) {
      let url: unknown = entry;
      if (entry && typeof entry === "object") {
        const media = entry as Record<string, unknown>;
        if (media.type && media.type !== "image") continue;
        url = media.url ?? media.src ?? media.image_url ?? media.thumbnail_url;
      }
      if (typeof url === "string" && /^https?:\/\//.test(url) && !urls.includes(url)) urls.push(url);
    }
    // The first source that yields images wins, so a short gallery doesn't
    // get mixed with a longer, differently ordered media list.
    if (urls.length) break;
  }
  return urls;
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
  const images = fields.images;

  return {
    key: `${platform}:${fields.id}`,
    listingId: `${platform}:${fields.id}#${shortHash(`${fields.name.toLowerCase()}|${(fields.quantity ?? "").toLowerCase()}`)}`,
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
    images: extractImages(raw.images, raw.image),
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

export function normalizeItem(
  platform: PlatformId,
  raw: ApiItem,
  fallbackEta?: string | null,
): ProductDetail | null {
  const info = typeof raw.platform === "object" && raw.platform ? raw.platform : {};
  const meta = asRecord(raw.metadata);
  const offer = buildOffer(platform, {
    id: String(raw.item_id),
    name: toText(raw.name),
    brand: toText(raw.brand),
    // metadata.media is the full set (with thumbnails); gallery is often just the hero.
    images: extractImages(meta.media, raw.gallery, raw.images, meta.images),
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

  return {
    ...offer,
    storeId: toText(raw.store_id ?? null),
    fetchedAt: toText(raw.fetched_at ?? null),
    variants: [],
    info: productInfo(raw, meta),
  };
}

/* ----------------------------- metadata parsing ---------------------------- */

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function textList(value: unknown, field = "text"): string[] {
  return asArray(value)
    .map((entry) => (typeof entry === "string" ? entry : toText(asRecord(entry)[field])))
    .filter((entry): entry is string => Boolean(entry && entry.trim()))
    .map((entry) => entry.trim());
}

/** "About the Product\nBody…\n\nIngredients\nBody…" → titled sections. */
function splitSections(description: string): ProductInfo["sections"] {
  return description
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const [first, ...rest] = block.split("\n");
      const looksLikeHeading = rest.length > 0 && first.length <= 40 && !/[.:;!?]$/.test(first.trim());
      return looksLikeHeading
        ? { heading: first.trim(), body: rest.join("\n").trim() }
        : { heading: null, body: block };
    })
    .filter((section) => section.body.length > 0);
}

function productInfo(raw: ApiItem, meta: Record<string, unknown>): ProductInfo {
  const description = toText(meta.description) ?? toText(raw.description);
  const sections = description ? splitSections(description) : [];
  const hasSection = (word: string) => sections.some((s) => s.heading?.toLowerCase().includes(word));

  // Only add structured fields the description doesn't already cover.
  const extras: [string, string, unknown][] = [
    ["ingredient", "Ingredients", meta.ingredients],
    ["use", "How to use", meta.usage_instructions],
    ["storage", "Storage", meta.storage_instructions],
    ["allergen", "Allergens", meta.allergens],
    ["nutrition", "Nutrition", meta.nutrition],
  ];
  for (const [word, heading, value] of extras) {
    const body = toText(value);
    if (body && !hasSection(word)) sections.push({ heading, body });
  }

  const manufacturer = asRecord(meta.manufacturer);
  const seller = asRecord(meta.seller);
  const shelfLife = asRecord(meta.shelf_life);
  const returnPolicy = asRecord(meta.return_policy);
  const category = toText(meta.category) ?? toText(raw.category);
  const subcategory = toText(meta.subcategory) ?? toText(raw.subcategory);

  const specs: ProductSpec[] = [];
  const add = (group: string, label: string, value: unknown) => {
    const text = typeof value === "number" ? String(value) : toText(value);
    if (text && !specs.some((s) => s.label.toLowerCase() === label.toLowerCase())) {
      specs.push({ group, label, value: text });
    }
  };

  add("General", "Category", [category, subcategory].filter(Boolean).join(" › ") || null);
  add("General", "Country of origin", meta.country_of_origin);
  add("General", "Shelf life", shelfLife.text ?? meta.shelf_life);
  add("General", "Returns", returnPolicy.text);
  for (const spec of asArray(meta.specifications)) {
    const entry = asRecord(spec);
    add(toText(entry.group) ?? "Specifications", toText(entry.label) ?? "", entry.value);
  }
  add(
    "Manufacturer Info",
    "Manufacturer",
    [toText(manufacturer.name), toText(manufacturer.address)].filter(Boolean).join(", ") || null,
  );
  add("Manufacturer Info", "Sold by", toText(seller.name));

  return {
    category,
    sections,
    highlights: textList(meta.key_features),
    specifications: specs.filter((s) => s.label),
    dietaryLabels: textList(meta.dietary_labels),
    badges: textList(meta.badges),
    disclaimer: toText(meta.disclaimer),
  };
}
