import "server-only";
import { PLATFORMS, type PlatformId } from "@/config/platforms";
import type { ApiItem, ApiSearchProduct } from "./types";

/**
 * Deterministic sample catalogue used when no QuickCommerce API key is set
 * (or QUICKCOMMERCE_MOCK=true). Lets the whole app be explored offline and in
 * CI without spending credits. Prices vary per platform from a stable hash.
 */

interface MockProduct {
  slug: string;
  name: string;
  brand: string;
  quantity: string;
  mrp: number;
  tags: string[];
}

const CATALOGUE: MockProduct[] = [
  { slug: "amul-butter-500", name: "Amul Pasteurised Butter", brand: "Amul", quantity: "500 g", mrp: 305, tags: ["butter", "dairy"] },
  { slug: "amul-butter-100", name: "Amul Pasteurised Butter", brand: "Amul", quantity: "100 g", mrp: 62, tags: ["butter", "dairy"] },
  { slug: "amul-taaza-1l", name: "Amul Taaza Toned Fresh Milk", brand: "Amul", quantity: "1 l", mrp: 74, tags: ["milk", "dairy"] },
  { slug: "nandini-milk-500", name: "Nandini Toned Milk", brand: "Nandini", quantity: "500 ml", mrp: 26, tags: ["milk", "dairy"] },
  { slug: "mother-dairy-curd", name: "Mother Dairy Classic Curd", brand: "Mother Dairy", quantity: "400 g", mrp: 45, tags: ["curd", "dahi", "dairy"] },
  { slug: "eggs-12", name: "Farm Fresh White Eggs", brand: "Eggoz", quantity: "12 pcs", mrp: 120, tags: ["eggs", "egg"] },
  { slug: "aashirvaad-atta-5", name: "Aashirvaad Shudh Chakki Atta", brand: "Aashirvaad", quantity: "5 kg", mrp: 310, tags: ["atta", "flour", "wheat"] },
  { slug: "fortune-atta-5", name: "Fortune Chakki Fresh Atta", brand: "Fortune", quantity: "5 kg", mrp: 285, tags: ["atta", "flour", "wheat"] },
  { slug: "india-gate-basmati-1", name: "India Gate Basmati Rice Classic", brand: "India Gate", quantity: "1 kg", mrp: 245, tags: ["rice", "basmati"] },
  { slug: "daawat-basmati-5", name: "Daawat Rozana Super Basmati Rice", brand: "Daawat", quantity: "5 kg", mrp: 649, tags: ["rice", "basmati"] },
  { slug: "tata-salt-1", name: "Tata Salt Vacuum Evaporated Iodised", brand: "Tata", quantity: "1 kg", mrp: 28, tags: ["salt"] },
  { slug: "toor-dal-1", name: "Tata Sampann Unpolished Toor Dal", brand: "Tata Sampann", quantity: "1 kg", mrp: 215, tags: ["dal", "toor", "pulses"] },
  { slug: "maggi-12", name: "Maggi 2-Minute Masala Instant Noodles", brand: "Maggi", quantity: "12 x 70 g", mrp: 168, tags: ["maggi", "noodles"] },
  { slug: "maggi-4", name: "Maggi 2-Minute Masala Instant Noodles", brand: "Maggi", quantity: "4 x 70 g", mrp: 56, tags: ["maggi", "noodles"] },
  { slug: "lays-classic", name: "Lay's Classic Salted Potato Chips", brand: "Lay's", quantity: "52 g", mrp: 20, tags: ["chips", "snacks", "lays"] },
  { slug: "kurkure-masala", name: "Kurkure Masala Munch", brand: "Kurkure", quantity: "90 g", mrp: 20, tags: ["chips", "snacks", "namkeen"] },
  { slug: "haldiram-bhujia", name: "Haldiram's Aloo Bhujia", brand: "Haldiram's", quantity: "400 g", mrp: 110, tags: ["namkeen", "snacks", "bhujia"] },
  { slug: "coke-750", name: "Coca-Cola Soft Drink", brand: "Coca-Cola", quantity: "750 ml", mrp: 40, tags: ["coca cola", "coke", "cold drink", "soft drink"] },
  { slug: "coke-2l", name: "Coca-Cola Soft Drink", brand: "Coca-Cola", quantity: "2 l", mrp: 99, tags: ["coca cola", "coke", "cold drink", "soft drink"] },
  { slug: "thums-up-750", name: "Thums Up Soft Drink", brand: "Thums Up", quantity: "750 ml", mrp: 40, tags: ["cold drink", "soft drink"] },
  { slug: "red-label-500", name: "Brooke Bond Red Label Tea", brand: "Brooke Bond", quantity: "500 g", mrp: 290, tags: ["tea", "chai"] },
  { slug: "nescafe-classic-100", name: "Nescafe Classic Instant Coffee", brand: "Nescafe", quantity: "100 g", mrp: 375, tags: ["coffee"] },
  { slug: "surf-excel-2", name: "Surf Excel Easy Wash Detergent Powder", brand: "Surf Excel", quantity: "2 kg", mrp: 280, tags: ["detergent", "surf excel", "washing"] },
  { slug: "ariel-matic-2", name: "Ariel Matic Front Load Detergent Powder", brand: "Ariel", quantity: "2 kg", mrp: 599, tags: ["detergent", "washing"] },
  { slug: "vim-bar", name: "Vim Dishwash Bar Lemon", brand: "Vim", quantity: "3 x 200 g", mrp: 60, tags: ["dishwash", "cleaning"] },
  { slug: "dove-shampoo-340", name: "Dove Intense Repair Shampoo", brand: "Dove", quantity: "340 ml", mrp: 425, tags: ["shampoo", "hair"] },
  { slug: "colgate-strong-200", name: "Colgate Strong Teeth Toothpaste", brand: "Colgate", quantity: "200 g", mrp: 136, tags: ["toothpaste", "oral care"] },
  { slug: "dettol-soap-4", name: "Dettol Original Bathing Soap", brand: "Dettol", quantity: "4 x 125 g", mrp: 240, tags: ["soap", "bath"] },
  { slug: "pampers-m-62", name: "Pampers All Round Protection Pants Medium", brand: "Pampers", quantity: "62 pcs", mrp: 1349, tags: ["diapers", "baby"] },
  { slug: "banana-robusta", name: "Banana Robusta", brand: "Fresho", quantity: "6 pcs", mrp: 60, tags: ["banana", "fruits", "fresh"] },
  { slug: "onion-1", name: "Onion", brand: "Fresho", quantity: "1 kg", mrp: 55, tags: ["onion", "vegetables", "fresh vegetables"] },
  { slug: "tomato-500", name: "Tomato Hybrid", brand: "Fresho", quantity: "500 g", mrp: 35, tags: ["tomato", "vegetables", "fresh vegetables"] },
];

/** Small per-platform naming quirks so matching is exercised realistically. */
const NAME_STYLE: Record<PlatformId, (p: MockProduct) => string> = {
  blinkit: (p) => p.name,
  zepto: (p) => `${p.name} (${p.quantity})`,
  instamart: (p) => p.name.replace(p.brand, "").trim() ? `${p.brand} ${p.name.replace(p.brand, "").trim()}` : p.name,
  bigbasket: (p) => `${p.name} - ${p.quantity}`,
  jiomart: (p) => `${p.name} ${p.quantity}`,
  dmart: (p) => `${p.brand.toUpperCase()} ${p.name.replace(p.brand, "").trim()}`,
  amazon: (p) => `${p.name}, ${p.quantity}`,
};

const PLATFORM_BIAS: Record<PlatformId, number> = {
  blinkit: 0.97,
  zepto: 0.95,
  instamart: 0.96,
  bigbasket: 0.93,
  jiomart: 0.9,
  dmart: 0.86,
  amazon: 0.92,
};

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function mockId(platform: PlatformId, slug: string) {
  return `${platform.slice(0, 2)}-${slug}`;
}

function toApiProduct(platform: PlatformId, product: MockProduct): ApiSearchProduct | null {
  const seed = hash(`${platform}:${product.slug}`);
  if (seed < 0.12) return null; // not every platform stocks everything
  const price = Math.max(5, Math.round(product.mrp * PLATFORM_BIAS[platform] * (0.94 + seed * 0.12)));
  const meta = PLATFORMS[platform];
  return {
    id: mockId(platform, product.slug),
    name: NAME_STYLE[platform](product),
    brand: product.brand,
    available: seed > 0.2,
    images: [],
    mrp: product.mrp,
    offer_price: Math.min(price, product.mrp),
    quantity: product.quantity,
    deeplink: `${meta.homepage}/search?q=${encodeURIComponent(product.name)}`,
    rating: Math.round((3.6 + seed * 1.3) * 10) / 10,
    rating_count: Math.round(200 + seed * 9000),
    inventory: Math.round(seed * 40),
    platform: {
      name: meta.apiName,
      sla: meta.kind === "quick" ? `${Math.round(8 + seed * 14)} mins` : meta.typicalEta,
      open: true,
    },
  };
}

function matches(product: MockProduct, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1 && !/^\d/.test(t));
  if (!terms.length) return false;
  const haystack = `${product.name} ${product.brand} ${product.tags.join(" ")}`.toLowerCase();
  return terms.every((term) => haystack.includes(term)) || product.tags.includes(query.toLowerCase());
}

export function mockSearch(platform: PlatformId, query: string): ApiSearchProduct[] {
  const hits = CATALOGUE.filter((p) => matches(p, query));
  return hits.map((p) => toApiProduct(platform, p)).filter((p): p is ApiSearchProduct => p !== null);
}

export function mockItem(platform: PlatformId, itemId: string): ApiItem | null {
  const product = CATALOGUE.find((p) => mockId(platform, p.slug) === itemId);
  const listing = product && toApiProduct(platform, product);
  if (!listing) return null;
  return {
    item_id: String(listing.id),
    name: listing.name,
    brand: listing.brand,
    quantity: listing.quantity,
    available: listing.available,
    price: listing.offer_price,
    mrp: listing.mrp,
    inventory: listing.inventory,
    deeplink: listing.deeplink,
    rating: listing.rating,
    rating_count: listing.rating_count,
    platform: listing.platform,
    store_id: "demo-store",
    fetched_at: new Date().toISOString(),
    gallery: [],
    category: product.tags[0],
  };
}
