import type { Metadata } from "next";
import { Suspense } from "react";
import { QueryKeyedSuspense } from "@/components/search/search-state";
import { SearchResults, SearchResultsSkeleton } from "./search-results";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  return {
    title: query ? `Compare prices for “${query}”` : "Search",
    robots: { index: false },
  };
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="container-page py-6 sm:py-8">
      <Suspense fallback={<SearchResultsSkeleton />}>
        <QueryKeyedSuspense fallback={<SearchResultsSkeleton />}>
          <SearchResults searchParams={searchParams} />
        </QueryKeyedSuspense>
      </Suspense>
    </div>
  );
}
