"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, createContext, use, useCallback, useTransition } from "react";
import { filtersToQuery, type SearchFilters } from "@/lib/quickcommerce/filters";
import { cn } from "@/lib/utils";

interface SearchState {
  filters: SearchFilters;
  pending: boolean;
  update: (patch: Partial<SearchFilters>) => void;
  reset: () => void;
}

const SearchStateContext = createContext<SearchState | null>(null);

/**
 * Owns URL-driven filter state for the results page. Filters live in the URL so
 * results are shareable, back-button friendly and rendered on the server.
 */
export function SearchStateProvider({ filters, children }: { filters: SearchFilters; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const navigate = useCallback(
    (next: Partial<SearchFilters>) => {
      const query = filtersToQuery(next);
      startTransition(() => router.replace(`${pathname}?${query}`, { scroll: false }));
    },
    [pathname, router],
  );

  const update = useCallback(
    (patch: Partial<SearchFilters>) => navigate({ ...filters, page: 1, ...patch }),
    [filters, navigate],
  );

  const reset = useCallback(
    () => navigate({ q: filters.q, view: filters.view, sort: filters.sort }),
    [filters.q, filters.sort, filters.view, navigate],
  );

  return <SearchStateContext value={{ filters, pending, update, reset }}>{children}</SearchStateContext>;
}

export function useSearchState(): SearchState {
  const state = use(SearchStateContext);
  if (!state) throw new Error("useSearchState must be used inside SearchStateProvider");
  return state;
}

/** Dims results while a filter change is being applied. */
export function PendingRegion({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useSearchState();
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-200", pending && "pointer-events-none opacity-50", className)}>
      {children}
    </div>
  );
}

/** Remounts its Suspense boundary per query so a new search shows skeletons. */
export function QueryKeyedSuspense({ fallback, children }: { fallback: React.ReactNode; children: React.ReactNode }) {
  const params = useSearchParams();
  const key = `${params.get("q") ?? ""}|${params.get("platforms") ?? ""}`;
  return (
    <Suspense key={key} fallback={fallback}>
      {children}
    </Suspense>
  );
}
