export type PageItem = number | "gap";

const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

/**
 * Page links to show: a sliding window of `windowSize` pages around the
 * current one, plus the first page and the last `tail` pages, with gaps.
 *   page 1 of 12  → 1 2 3 4 5 … 11 12
 *   page 6 of 12  → 1 … 4 5 6 7 8 … 11 12
 *   page 12 of 12 → 1 … 6 7 8 9 10 11 12
 */
export function pageItems(page: number, count: number, windowSize = 5, tail = 2): PageItem[] {
  if (count <= windowSize + tail + 1) return range(1, count);

  const lastWindowStart = count - tail - windowSize + 1;
  const start = Math.min(Math.max(1, page - Math.floor(windowSize / 2)), lastWindowStart);
  const pages = [...new Set([1, ...range(start, start + windowSize - 1), ...range(count - tail + 1, count)])].sort(
    (a, b) => a - b,
  );

  const items: PageItem[] = [];
  pages.forEach((p, i) => {
    const previous = pages[i - 1];
    // An ellipsis that hides a single page is worse than just showing it.
    if (i > 0 && p - previous === 2) items.push(previous + 1);
    else if (i > 0 && p - previous > 2) items.push("gap");
    items.push(p);
  });
  return items;
}
