import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { getLocation } from "@/lib/location.server";
import { HeaderActions, HeaderActionsFallback } from "./header-actions";
import { LocationPicker, LocationPickerFallback } from "./location-picker";
import { SearchBar, SearchBarFallback } from "./search-bar";

async function CurrentLocation({ className }: { className?: string }) {
  const location = await getLocation();
  return <LocationPicker location={location} className={className} />;
}

/**
 * Desktop: one 56px row — logo, delivery location, search, account.
 * Mobile: logo + location + account on the first row, search on the second,
 * so results start as high on the screen as possible.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="container-page flex h-14 items-center gap-2 md:gap-5">
        <Logo href="/home" compact className="md:hidden" />
        <Logo href="/home" className="hidden md:flex" />
        <div className="min-w-0 flex-1 md:max-w-[15rem] md:flex-none">
          <Suspense fallback={<LocationPickerFallback />}>
            <CurrentLocation className="max-w-full" />
          </Suspense>
        </div>
        <div className="hidden min-w-0 flex-1 md:block">
          <Suspense fallback={<SearchBarFallback />}>
            <SearchBar />
          </Suspense>
        </div>
        <div className="shrink-0">
          <Suspense fallback={<HeaderActionsFallback />}>
            <HeaderActions />
          </Suspense>
        </div>
      </div>
      <div className="container-page pb-2.5 md:hidden">
        <Suspense fallback={<SearchBarFallback />}>
          <SearchBar />
        </Suspense>
      </div>
    </header>
  );
}
