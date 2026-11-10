import { PackageSearchIcon, SearchXIcon, ServerCrashIcon } from "lucide-react";
import Link from "next/link";
import { after } from "next/server";
import { EmptyState } from "@/components/common/empty-state";
import { OfferCard, ProductCardSkeleton, ProductGroupCard } from "@/components/product/product-card";
import { FiltersPanel } from "@/components/search/filters-panel";
import { PlatformStatusBar } from "@/components/search/platform-status-bar";
import { ActiveFilters, Pagination, ResultsToolbar } from "@/components/search/results-toolbar";
import { PendingRegion, SearchStateProvider } from "@/components/search/search-state";
import { Button } from "@/components/ui/button";
import { popularSearches } from "@/config/site";
import { getCurrentUser, requireUser } from "@/lib/auth/dal";
import { recordSearch } from "@/lib/data/profile";
import { getUserProductState } from "@/lib/data/user-product-state";
import { pluralize } from "@/lib/format";
import { getLocation } from "@/lib/location.server";
import { buildFacets, parseSearchParams, shapeResults } from "@/lib/quickcommerce/filters";
import { searchProducts } from "@/lib/quickcommerce/service";
import { searchHref } from "@/lib/routes";

export async function SearchResults({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const [filters] = await Promise.all([searchParams.then(parseSearchParams), requireUser("/search")]);

  if (!filters.q) {
    return (
      <EmptyState
        icon={PackageSearchIcon}
        title="What are you shopping for?"
        description="Search once and we'll compare prices across every platform that delivers to you."
      >
        {popularSearches.map((term) => (
          <Button key={term} variant="outline" size="sm" asChild>
            <Link href={searchHref(term)}>{term}</Link>
          </Button>
        ))}
      </EmptyState>
    );
  }

  const location = await getLocation();
  const [result, userState, user] = await Promise.all([
    searchProducts(filters.q, filters.platforms, location),
    getUserProductState(),
    getCurrentUser(),
  ]);

  if (user) {
    after(() => recordSearch(user.id, filters.q).catch(() => undefined));
  }

  const facets = buildFacets(result.offers);
  const shaped = shapeResults(result.offers, filters);
  const allFailed = result.statuses.length > 0 && result.statuses.every((s) => !s.ok);
  const cardState = { savedKeys: userState.savedKeys, cartKeys: userState.cartKeys };

  return (
    <SearchStateProvider filters={filters}>
      <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
        <aside className="hidden w-60 shrink-0 lg:block" aria-label="Filters">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-x-hidden overflow-y-auto pr-2 text-sm">
            <FiltersPanel facets={facets} statuses={result.statuses} />
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-3" aria-labelledby="results-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 id="results-heading" className="truncate text-2xl">
                {filters.q}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {filters.view === "grouped"
                  ? `${pluralize(shaped.total, "product")} from ${pluralize(result.offers.length, "listing")}`
                  : pluralize(shaped.total, "listing")}{" "}
                for {location.pincode}
              </p>
            </div>
            <ResultsToolbar facets={facets} statuses={result.statuses} total={shaped.total} />
          </div>

          <PlatformStatusBar statuses={result.statuses} />
          <ActiveFilters />

          <PendingRegion>
            {allFailed ? (
              <EmptyState
                icon={ServerCrashIcon}
                title="We couldn't reach the platforms"
                description={
                  result.statuses[0]?.error === "no_credits"
                    ? "The QuickCommerce API has run out of credits. Top up the account to resume live prices."
                    : "Live prices are temporarily unavailable. Please try again in a moment."
                }
              >
                <Button asChild>
                  <Link href={searchHref(filters.q)}>Try again</Link>
                </Button>
              </EmptyState>
            ) : shaped.total === 0 ? (
              <EmptyState
                icon={SearchXIcon}
                title={result.offers.length ? "No products match these filters" : `No results for “${filters.q}”`}
                description={
                  result.offers.length
                    ? "Try removing a filter or widening the price range."
                    : "Check the spelling, try a more general term, or change your delivery location."
                }
              />
            ) : (
              <>
                <ul className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {filters.view === "grouped"
                    ? shaped.groups.map((group) => (
                        <li key={group.id} className="flex">
                          <div className="w-full">
                            <ProductGroupCard group={group} query={filters.q} state={cardState} />
                          </div>
                        </li>
                      ))
                    : shaped.offers.map((offer) => (
                        <li key={offer.listingId} className="flex">
                          <div className="w-full">
                            <OfferCard offer={offer} query={filters.q} state={cardState} />
                          </div>
                        </li>
                      ))}
                </ul>
                <Pagination page={shaped.page} pageCount={shaped.pageCount} />
              </>
            )}
          </PendingRegion>
        </section>
      </div>
    </SearchStateProvider>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="flex gap-8" aria-busy aria-label="Loading results">
      <div className="hidden w-60 shrink-0 space-y-3 lg:block">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${60 + ((i * 13) % 35)}%` }} />
        ))}
      </div>
      <div className="flex-1 space-y-4">
        <div className="space-y-2">
          <div className="h-7 w-64 animate-pulse rounded bg-muted" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-7 w-24 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Fetching live prices from every platform…</p>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
