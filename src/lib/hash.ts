/** 32-bit FNV-1a: fast, deterministic, dependency-free. Not for security. */
export function fnv1a(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Short, stable base-36 digest, e.g. for salting identifiers. */
export function shortHash(text: string): string {
  return fnv1a(text).toString(36);
}

/** Keeps the first item for each id, preserving order. */
export function uniqueBy<T>(items: T[], id: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = id(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
