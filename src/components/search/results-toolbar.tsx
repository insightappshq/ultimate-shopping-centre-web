"use client";

import { LayoutGridIcon, Rows3Icon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PLATFORMS, PLATFORM_LIST } from "@/config/platforms";
import { formatPrice } from "@/lib/format";
import { SORT_OPTIONS, type SearchFacets, type SortOption } from "@/lib/quickcommerce/filters";
import type { PlatformStatus } from "@/lib/quickcommerce/types";
import { FiltersPanel } from "./filters-panel";
import { useSearchState } from "./search-state";

export function ResultsToolbar({
  facets,
  statuses,
  total,
}: {
  facets: SearchFacets;
  statuses: PlatformStatus[];
  total: number;
}) {
  const { filters, update } = useSearchState();

  return (
    <div className="flex items-center gap-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="lg:hidden">
            <SlidersHorizontalIcon data-icon="inline-start" />
            Filters
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[88vw] max-w-sm gap-0 p-0">
          <SheetHeader className="border-b">
            <SheetTitle>Filter results</SheetTitle>
            <SheetDescription>Changes apply instantly.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4">
            <FiltersPanel facets={facets} statuses={statuses} />
          </div>
          <SheetFooter className="border-t">
            <SheetTrigger asChild>
              <Button size="xl">Show {total} results</Button>
            </SheetTrigger>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ToggleGroup
        type="single"
        variant="outline"
        spacing={0}
        value={filters.view}
        onValueChange={(view) => view && update({ view: view as "grouped" | "list" })}
        aria-label="Result layout"
      >
        <ToggleGroupItem value="grouped" aria-label="Compare view" className="h-9 gap-1.5 px-3 data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground">
          <LayoutGridIcon className="size-4" />
          <span className="hidden sm:inline">Compare</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="list" aria-label="All listings" className="h-9 gap-1.5 px-3 data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground">
          <Rows3Icon className="size-4" />
          <span className="hidden sm:inline">All listings</span>
        </ToggleGroupItem>
      </ToggleGroup>

      <Select value={filters.sort} onValueChange={(sort) => update({ sort: sort as SortOption })}>
        <SelectTrigger className="h-9! min-w-0 flex-1 bg-card sm:min-w-44 sm:flex-none" aria-label="Sort results">
          <span className="hidden text-muted-foreground sm:inline">Sort:</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Removable chips summarising every active filter. */
export function ActiveFilters() {
  const { filters, update, reset } = useSearchState();
  const chips: { key: string; label: string; clear: () => void }[] = [];

  if (filters.platforms.length < PLATFORM_LIST.length) {
    chips.push({
      key: "platforms",
      label: filters.platforms.map((p) => PLATFORMS[p].shortName).join(", "),
      clear: () => update({ platforms: PLATFORM_LIST.map((p) => p.id) }),
    });
  }
  for (const brand of filters.brands) {
    chips.push({
      key: `brand-${brand}`,
      label: brand,
      clear: () => update({ brands: filters.brands.filter((b) => b !== brand) }),
    });
  }
  if (filters.minPrice || filters.maxPrice) {
    const label = [
      filters.minPrice ? formatPrice(filters.minPrice) : "Any",
      filters.maxPrice ? formatPrice(filters.maxPrice) : "Any",
    ].join(" – ");
    chips.push({ key: "price", label, clear: () => update({ minPrice: undefined, maxPrice: undefined }) });
  }
  if (filters.inStock) chips.push({ key: "stock", label: "In stock", clear: () => update({ inStock: false }) });
  if (filters.minDiscount) {
    chips.push({ key: "discount", label: `${filters.minDiscount}%+ off`, clear: () => update({ minDiscount: undefined }) });
  }
  if (filters.minRating) {
    chips.push({ key: "rating", label: `${filters.minRating}★ & above`, clear: () => update({ minRating: undefined }) });
  }
  if (filters.maxEta) {
    chips.push({ key: "eta", label: `Under ${filters.maxEta} mins`, clear: () => update({ maxEta: undefined }) });
  }

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.clear}
          className="inline-flex h-7 items-center gap-1 rounded-md bg-secondary px-2.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/70"
          aria-label={`Remove filter ${chip.label}`}
        >
          {chip.label}
          <XIcon className="size-3" aria-hidden />
        </button>
      ))}
      <Button variant="link" size="sm" className="h-auto px-1" onClick={reset}>
        Clear all
      </Button>
    </div>
  );
}

export function Pagination({ page, pageCount }: { page: number; pageCount: number }) {
  const { update } = useSearchState();
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );

  const go = (p: number) => {
    update({ page: p });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 pt-6">
      <Button variant="outline" size="lg" disabled={page <= 1} onClick={() => go(page - 1)}>
        Previous
      </Button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-muted-foreground">…</span>}
          <Button
            variant={p === page ? "default" : "ghost"}
            size="icon-lg"
            aria-current={p === page ? "page" : undefined}
            onClick={() => go(p)}
          >
            {p}
          </Button>
        </span>
      ))}
      <Button variant="outline" size="lg" disabled={page >= pageCount} onClick={() => go(page + 1)}>
        Next
      </Button>
    </nav>
  );
}
