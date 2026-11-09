import type { UnitPrice } from "./types";

interface ParsedQuantity {
  amount: number;
  unit: "g" | "ml" | "pc";
}

const UNIT_FACTORS: Record<string, { unit: ParsedQuantity["unit"]; factor: number }> = {
  g: { unit: "g", factor: 1 },
  gm: { unit: "g", factor: 1 },
  gms: { unit: "g", factor: 1 },
  gram: { unit: "g", factor: 1 },
  grams: { unit: "g", factor: 1 },
  kg: { unit: "g", factor: 1000 },
  kgs: { unit: "g", factor: 1000 },
  ml: { unit: "ml", factor: 1 },
  l: { unit: "ml", factor: 1000 },
  ltr: { unit: "ml", factor: 1000 },
  litre: { unit: "ml", factor: 1000 },
  liter: { unit: "ml", factor: 1000 },
  pc: { unit: "pc", factor: 1 },
  pcs: { unit: "pc", factor: 1 },
  piece: { unit: "pc", factor: 1 },
  pieces: { unit: "pc", factor: 1 },
  unit: { unit: "pc", factor: 1 },
  units: { unit: "pc", factor: 1 },
  pack: { unit: "pc", factor: 1 },
  n: { unit: "pc", factor: 1 },
};

/**
 * Parses pack sizes such as "500 g", "1 kg", "2 x 500 ml", "6 pcs", "1L".
 * Returns null for anything ambiguous rather than guessing.
 */
export function parseQuantity(raw: string | null | undefined): ParsedQuantity | null {
  if (!raw) return null;
  const text = raw.toLowerCase().replace(/,/g, "").trim();

  const multi = text.match(/(\d+)\s*[x×*]\s*(\d+(?:\.\d+)?)\s*([a-z]+)/);
  if (multi) {
    const spec = UNIT_FACTORS[multi[3]];
    if (spec) return { amount: Number(multi[1]) * Number(multi[2]) * spec.factor, unit: spec.unit };
  }

  const single = text.match(/(\d+(?:\.\d+)?)\s*([a-z]+)/);
  if (single) {
    const spec = UNIT_FACTORS[single[2]];
    if (spec) return { amount: Number(single[1]) * spec.factor, unit: spec.unit };
  }
  return null;
}

export function unitPrice(price: number, quantity: string | null | undefined): UnitPrice | null {
  const parsed = parseQuantity(quantity);
  if (!parsed || parsed.amount <= 0 || price <= 0) return null;
  if (parsed.unit === "pc") return { per: "1 pc", value: price / parsed.amount };
  return { per: `100 ${parsed.unit}`, value: (price / parsed.amount) * 100 };
}

/** Normalised quantity key used to decide whether two listings are the same pack. */
export function quantityKey(raw: string | null | undefined): string | null {
  const parsed = parseQuantity(raw);
  return parsed ? `${Math.round(parsed.amount)}${parsed.unit}` : null;
}

/** "8 mins" → 8, "1 hr" → 60, 12 → 12. */
export function etaToMinutes(eta: string | number | null | undefined): number | null {
  if (eta === null || eta === undefined || eta === "") return null;
  if (typeof eta === "number") return Number.isFinite(eta) ? eta : null;
  const text = eta.toLowerCase();
  const value = Number(text.match(/(\d+(?:\.\d+)?)/)?.[1]);
  if (!Number.isFinite(value)) return null;
  if (/day/.test(text)) return value * 24 * 60;
  if (/h(ou)?r/.test(text)) return value * 60;
  return value;
}
