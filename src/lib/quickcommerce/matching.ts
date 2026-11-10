import type { PlatformId } from "@/config/platforms";
import type { ComparisonRow, Offer, ProductGroup } from "./types";
import { uniqueBy } from "@/lib/hash";
import { quantityKey } from "./units";

/**
 * Lightweight, dependency-free product matching. Platforms name the same
 * product differently ("Amul Butter 500g" vs "Amul Pasteurised Butter"), so we
 * compare normalised token sets and treat pack size as a hard signal.
 */

const STOP_WORDS = new Set([
  "a", "an", "and", "the", "of", "with", "for", "in", "on", "by", "to", "from",
  "pack", "packet", "pouch", "bottle", "jar", "box", "combo", "new", "fresh",
  "pc", "pcs", "piece", "pieces", "unit", "units", "x", "container", "tub", "carton",
  "tin", "refill", "can", "bag", "value", "pack", "offer",
]);

const UNIT_TOKEN = /^\d+(\.\d+)?(g|gm|gms|kg|kgs|ml|l|ltr|litre|liter|pc|pcs|n)?$/;
/** Units written apart from their number ("5 kg") — pack size is compared separately. */
const UNIT_WORDS = new Set(["g", "gm", "gms", "gram", "grams", "kg", "kgs", "ml", "ltr", "litre", "liter", "litres", "pc", "pcs"]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9.\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token) && !UNIT_WORDS.has(token) && !UNIT_TOKEN.test(token));
}

function tokenSet(offer: Pick<Offer, "name" | "brand">): Set<string> {
  return new Set(tokenize(`${offer.brand ?? ""} ${offer.name}`));
}

function dice(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  for (const token of a) if (b.has(token)) overlap++;
  return (2 * overlap) / (a.size + b.size);
}

/** Share of the reference tokens present in the candidate (recall). */
function coverage(reference: Set<string>, candidate: Set<string>): number {
  if (!reference.size) return 0;
  let hits = 0;
  for (const token of reference) if (candidate.has(token)) hits++;
  return hits / reference.size;
}

/**
 * True when each name has a word the other lacks — "Plain" vs "Pepper",
 * "Salted" vs "Unsalted". That signals a different variant, not a renamed
 * listing, so the two must not be treated as the same product.
 */
function differentVariants(a: Set<string>, b: Set<string>, ignore: Set<string> = new Set()): boolean {
  let aOnly = false;
  let bOnly = false;
  for (const token of a) if (!b.has(token) && !ignore.has(token)) aOnly = true;
  for (const token of b) if (!a.has(token) && !ignore.has(token)) bOnly = true;
  return aOnly && bOnly;
}

/** Brand words aren't variant words: one platform may simply omit the brand from the name. */
function brandTokens(...brands: (string | null)[]): Set<string> {
  return new Set(tokenize(brands.filter(Boolean).join(" ")));
}

export function similarity(reference: Offer, candidate: Offer): number {
  const a = tokenSet(reference);
  const b = tokenSet(candidate);
  // A listing without a brand is assumed to carry the other's brand, so
  // "Lachkari Wada Kolam Rice" (no brand) can match "Daawat Lachkari…".
  if (reference.brand && !candidate.brand) for (const t of brandTokens(reference.brand)) b.add(t);
  if (candidate.brand && !reference.brand) for (const t of brandTokens(candidate.brand)) a.add(t);
  let score = 0.6 * dice(a, b) + 0.4 * coverage(a, b);

  if (reference.brand && candidate.brand) {
    const sameBrand = reference.brand.toLowerCase() === candidate.brand.toLowerCase();
    score += sameBrand ? 0.08 : -0.15;
  }

  const qa = quantityKey(reference.quantity);
  const qb = quantityKey(candidate.quantity);
  if (qa && qb) score = qa === qb ? score + 0.1 : Math.min(score, 0.55) - 0.1;

  // A different variant can still be shown as "similar", never as the same product.
  if (differentVariants(a, b, brandTokens(reference.brand, candidate.brand))) {
    score = Math.min(score, EXACT_THRESHOLD - 0.01);
  }

  return Math.max(0, Math.min(1, score));
}

const EXACT_THRESHOLD = 0.72;
/** Loose enough to catch "another brand of 5 kg rice", tight enough to skip unrelated items. */
const ALTERNATIVE_THRESHOLD = 0.15;
const SIMILAR_THRESHOLD = 0.5;

/** Best listing per platform for the reference product. */
export function matchAcrossPlatforms(
  reference: Offer,
  candidates: Offer[],
): { rows: ComparisonRow[]; related: Offer[]; alternative: Offer | null } {
  const bestByPlatform = new Map<PlatformId, ComparisonRow>();
  const related: { offer: Offer; score: number }[] = [];
  const packKey = quantityKey(reference.quantity);
  const alternatives: Offer[] = [];

  // Candidates may come from overlapping searches, so the same listing can repeat.
  for (const offer of uniqueBy(candidates, (o) => o.listingId)) {
    if (offer.key === reference.key) continue;
    const score = similarity(reference, offer);
    // Same pack size, at least loosely the same kind of product (e.g. "rice").
    if (
      score < EXACT_THRESHOLD &&
      score >= ALTERNATIVE_THRESHOLD &&
      offer.available &&
      packKey !== null &&
      quantityKey(offer.quantity) === packKey
    ) {
      alternatives.push(offer);
    }
    if (score >= SIMILAR_THRESHOLD) {
      const current = bestByPlatform.get(offer.platform);
      const better =
        !current ||
        score > current.score + 0.05 ||
        (Math.abs(score - current.score) <= 0.05 && offer.price < current.offer.price);
      if (better) {
        bestByPlatform.set(offer.platform, {
          offer,
          score,
          match: score >= EXACT_THRESHOLD ? "exact" : "similar",
        });
      }
    } else if (score >= 0.2) {
      related.push({ offer, score });
    }
  }

  const referenceRow: ComparisonRow = { offer: reference, score: 1, match: "exact" };
  const rows: ComparisonRow[] = [
    referenceRow,
    ...bestByPlatform.values(),
  ].filter((row, index, all) => all.findIndex((r) => r.offer.platform === row.offer.platform) === index);

  const sorted = rows.sort((a, b) => effectivePrice(a.offer) - effectivePrice(b.offer));
  const lowestExact = sorted.find((row) => row.match === "exact" && row.offer.available)?.offer.price ?? Infinity;
  const alternative =
    alternatives.filter((o) => o.price < lowestExact).sort((a, b) => a.price - b.price)[0] ?? null;

  return {
    rows: sorted,
    alternative,
    related: related
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((entry) => entry.offer),
  };
}

/** Out-of-stock listings sort after everything that can actually be bought. */
export function effectivePrice(offer: Offer): number {
  return offer.available ? offer.price : offer.price + 1_000_000;
}

const GROUP_THRESHOLD = 0.74;

/**
 * Greedily clusters search listings into cross-platform product groups.
 * Each group holds at most one listing per platform.
 */
export function groupOffers(offers: Offer[]): ProductGroup[] {
  const groups: { seed: Offer; tokens: Set<string>; qty: string | null; offers: Offer[] }[] = [];

  for (const offer of uniqueBy(offers, (o) => o.listingId)) {
    const tokens = tokenSet(offer);
    const qty = quantityKey(offer.quantity);
    let target: (typeof groups)[number] | undefined;
    let bestScore = 0;

    for (const group of groups) {
      if (group.offers.some((o) => o.platform === offer.platform)) continue;
      if (qty && group.qty && qty !== group.qty) continue;
      if (differentVariants(group.tokens, tokens, brandTokens(group.seed.brand, offer.brand))) continue;
      const score = 0.6 * dice(group.tokens, tokens) + 0.4 * coverage(group.tokens, tokens);
      if (score >= GROUP_THRESHOLD && score > bestScore) {
        bestScore = score;
        target = group;
      }
    }

    if (target) {
      target.offers.push(offer);
      target.qty ??= qty;
    } else {
      groups.push({ seed: offer, tokens, qty, offers: [offer] });
    }
  }

  return groups.map(({ seed, offers: groupOffers }) => toProductGroup(seed, groupOffers));
}

/**
 * Highest price among listings that are verifiably the same pack as `best`.
 * Savings are only claimed against like-for-like packs; unknown sizes don't count.
 */
function comparableHighest(best: Offer, available: Offer[]): number {
  const key = quantityKey(best.quantity);
  if (!key) return best.price;
  const same = available.filter((o) => quantityKey(o.quantity) === key);
  return same.length ? Math.max(best.price, ...same.map((o) => o.price)) : best.price;
}

/** Listings in a comparison that are the same product and pack — the only fair basis for "save ₹X". */
export function exactRows<T extends { match: "exact" | "similar"; offer: Offer }>(rows: T[]): T[] {
  return rows.filter((row) => row.match === "exact" && row.offer.available);
}

function toProductGroup(seed: Offer, offers: Offer[]): ProductGroup {
  const sorted = [...offers].sort((a, b) => effectivePrice(a) - effectivePrice(b));
  const best = sorted[0];
  const available = sorted.filter((o) => o.available);
  const etas = sorted.map((o) => o.etaMinutes).filter((m): m is number => m !== null);
  const ratings = sorted.map((o) => o.rating).filter((r): r is number => r !== null);

  // Platforms decorate names with pack sizes and separators; the shortest reads best.
  const name = sorted.map((o) => o.name).reduce((a, b) => (b.length < a.length ? b : a), seed.name);

  return {
    // Each listing joins exactly one group, so its listing id is a unique group id.
    id: best.listingId,
    name,
    brand: seed.brand ?? sorted.find((o) => o.brand)?.brand ?? null,
    quantity: seed.quantity ?? sorted.find((o) => o.quantity)?.quantity ?? null,
    image: seed.image ?? sorted.find((o) => o.image)?.image ?? null,
    offers: sorted,
    best,
    highestPrice: comparableHighest(best, available),
    maxDiscount: Math.max(...sorted.map((o) => o.discountPercent)),
    rating: ratings.length ? Math.max(...ratings) : null,
    fastestEtaMinutes: etas.length ? Math.min(...etas) : null,
  };
}

/** Builds a concise search query for finding the same product elsewhere. */
export function comparisonQuery(offer: Pick<Offer, "name" | "brand">): string {
  const words = offer.name.replace(/[()[\]|,]/g, " ").split(/\s+/).filter(Boolean);
  const base = words.slice(0, 6).join(" ");
  if (offer.brand && !base.toLowerCase().includes(offer.brand.toLowerCase())) {
    return `${offer.brand} ${words.slice(0, 5).join(" ")}`;
  }
  return base;
}
