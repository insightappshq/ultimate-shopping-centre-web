"use client";

import { AlertTriangleIcon, SearchIcon, StarIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PLATFORM_LIST, type PlatformId } from "@/config/platforms";
import {
  DISCOUNT_OPTIONS,
  ETA_OPTIONS,
  RATING_OPTIONS,
  type SearchFacets,
} from "@/lib/quickcommerce/filters";
import { formatPrice } from "@/lib/format";
import type { PlatformStatus } from "@/lib/quickcommerce/types";
import { cn } from "@/lib/utils";
import { useSearchState } from "./search-state";

export function FiltersPanel({
  facets,
  statuses,
  className,
}: {
  facets: SearchFacets;
  statuses: PlatformStatus[];
  className?: string;
}) {
  const { filters, update, reset } = useSearchState();
  const activeCount =
    (filters.platforms.length < PLATFORM_LIST.length ? 1 : 0) +
    filters.brands.length +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.minDiscount ? 1 : 0) +
    (filters.maxEta ? 1 : 0);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-base">Filters</h2>
        {activeCount > 0 && (
          <Button variant="link" size="sm" className="h-auto px-0" onClick={reset}>
            Clear all ({activeCount})
          </Button>
        )}
      </div>

      <FilterSection title="Platforms">
        <PlatformFilter
          selected={filters.platforms}
          counts={facets.platformCounts}
          statuses={statuses}
          onChange={(platforms) => update({ platforms })}
        />
      </FilterSection>

      <FilterSection title="Availability">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          In stock only
          <Switch checked={filters.inStock} onCheckedChange={(inStock) => update({ inStock })} />
        </label>
      </FilterSection>

      {facets.priceRange && facets.priceRange.max > facets.priceRange.min && (
        <FilterSection title="Price">
          <PriceFilter
            // Re-mount when the applied range changes so the slider resets.
            key={`${filters.minPrice}-${filters.maxPrice}-${facets.priceRange.min}-${facets.priceRange.max}`}
            range={facets.priceRange}
            min={filters.minPrice}
            max={filters.maxPrice}
            onChange={(minPrice, maxPrice) => update({ minPrice, maxPrice })}
          />
        </FilterSection>
      )}

      {facets.brands.length > 0 && (
        <FilterSection title="Brand">
          <BrandFilter
            brands={facets.brands}
            selected={filters.brands}
            onChange={(brands) => update({ brands })}
          />
        </FilterSection>
      )}

      <FilterSection title="Discount">
        <OptionList
          name="discount"
          value={filters.minDiscount}
          options={DISCOUNT_OPTIONS.map((v) => ({ value: v, label: `${v}% or more` }))}
          onChange={(minDiscount) => update({ minDiscount })}
        />
      </FilterSection>

      <FilterSection title="Customer rating">
        <OptionList
          name="rating"
          value={filters.minRating}
          options={RATING_OPTIONS.map((v) => ({
            value: v,
            label: (
              <span className="inline-flex items-center gap-1">
                {v}
                <StarIcon className="size-3 fill-deal text-deal" aria-hidden /> & above
              </span>
            ),
          }))}
          onChange={(minRating) => update({ minRating })}
        />
      </FilterSection>

      <FilterSection title="Delivery time" last>
        <OptionList
          name="eta"
          value={filters.maxEta}
          options={ETA_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(maxEta) => update({ maxEta })}
        />
      </FilterSection>
    </div>
  );
}

function FilterSection({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <fieldset className={cn("space-y-2.5 py-4", !last && "border-b")}>
      <legend className="sr-only">{title}</legend>
      <p className="text-[0.8rem] font-semibold text-foreground" aria-hidden>
        {title}
      </p>
      {children}
    </fieldset>
  );
}

const STATUS_COPY: Record<string, string> = {
  no_credits: "API credits exhausted",
  unauthorized: "API key invalid",
  not_found: "Not serviceable here",
  unavailable: "Not serviceable here",
  invalid: "Needs a pincode",
  rate_limited: "Busy — try again shortly",
  timeout: "Timed out",
  upstream: "Platform unavailable",
};

function PlatformFilter({
  selected,
  counts,
  statuses,
  onChange,
}: {
  selected: PlatformId[];
  counts: Partial<Record<PlatformId, number>>;
  statuses: PlatformStatus[];
  onChange: (platforms: PlatformId[]) => void;
}) {
  const toggle = (id: PlatformId, checked: boolean) => {
    const next = checked ? [...selected, id] : selected.filter((p) => p !== id);
    if (next.length) onChange(PLATFORM_LIST.map((p) => p.id).filter((p) => next.includes(p)));
  };

  return (
    <ul className="space-y-2.5">
      {PLATFORM_LIST.map((platform) => {
        const status = statuses.find((s) => s.platform === platform.id);
        const checked = selected.includes(platform.id);
        return (
          <li key={platform.id} className="flex items-center gap-2.5">
            <Checkbox
              id={`platform-${platform.id}`}
              checked={checked}
              disabled={checked && selected.length === 1}
              onCheckedChange={(value) => toggle(platform.id, value === true)}
            />
            <Label htmlFor={`platform-${platform.id}`} className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-normal">
              <PlatformLogo platform={platform.id} size="sm" />
              <span className="flex-1">{platform.name}</span>
            </Label>
            {status && !status.ok ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangleIcon className="size-3.5 text-warning" aria-label={STATUS_COPY[status.error ?? ""] ?? "Unavailable"} />
                </TooltipTrigger>
                <TooltipContent>{STATUS_COPY[status.error ?? ""] ?? status.message ?? "Unavailable"}</TooltipContent>
              </Tooltip>
            ) : checked ? (
              <span className="text-xs text-muted-foreground tabular">{counts[platform.id] ?? 0}</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function PriceFilter({
  range,
  min,
  max,
  onChange,
}: {
  range: { min: number; max: number };
  min?: number;
  max?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
}) {
  const [value, setValue] = useState<[number, number]>([min ?? range.min, max ?? range.max]);

  return (
    <div className="space-y-3 px-1">
      <Slider
        min={range.min}
        max={range.max}
        step={Math.max(1, Math.round((range.max - range.min) / 100))}
        value={value}
        onValueChange={(v) => setValue([v[0], v[1]])}
        onValueCommit={(v) =>
          onChange(v[0] > range.min ? v[0] : undefined, v[1] < range.max ? v[1] : undefined)
        }
        aria-label="Price range"
      />
      <div className="flex items-center justify-between text-xs font-medium tabular">
        <span className="rounded-md border bg-card px-2 py-1">{formatPrice(value[0])}</span>
        <span className="text-muted-foreground">to</span>
        <span className="rounded-md border bg-card px-2 py-1">{formatPrice(value[1])}</span>
      </div>
    </div>
  );
}

function BrandFilter({
  brands,
  selected,
  onChange,
}: {
  brands: { value: string; count: number }[];
  selected: string[];
  onChange: (brands: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const visible = useMemo(() => {
    const matches = brands.filter((b) => b.value.toLowerCase().includes(query.toLowerCase()));
    return expanded || query ? matches : matches.slice(0, 6);
  }, [brands, expanded, query]);

  const toggle = (brand: string, checked: boolean) =>
    onChange(checked ? [...selected, brand] : selected.filter((b) => b !== brand));

  return (
    <div className="space-y-2.5">
      {brands.length > 6 && (
        <div className="relative">
          <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brands"
            aria-label="Search brands"
            className="h-8 w-full rounded-md border bg-card pr-2 pl-8 text-sm outline-none focus:border-primary"
          />
        </div>
      )}
      <ul className="space-y-2">
        {visible.map((brand) => (
          <li key={brand.value} className="flex items-center gap-2.5">
            <Checkbox
              id={`brand-${brand.value}`}
              checked={selected.includes(brand.value)}
              onCheckedChange={(v) => toggle(brand.value, v === true)}
            />
            <Label htmlFor={`brand-${brand.value}`} className="flex-1 cursor-pointer truncate text-sm font-normal">
              {brand.value}
            </Label>
            <span className="text-xs text-muted-foreground tabular">{brand.count}</span>
          </li>
        ))}
      </ul>
      {!query && brands.length > 6 && (
        <Button variant="link" size="sm" className="h-auto px-0" onClick={() => setExpanded((e) => !e)}>
          {expanded ? "Show fewer" : `Show all ${brands.length} brands`}
        </Button>
      )}
    </div>
  );
}

function OptionList<T extends number>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: number | undefined;
  options: { value: T; label: React.ReactNode }[];
  onChange: (value: T | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={name}>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active ? undefined : option.value)}
            className={cn(
              "h-7 rounded-md border bg-card px-2.5 text-xs font-medium transition-colors",
              active ? "border-foreground bg-foreground text-background" : "hover:border-foreground/40",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
