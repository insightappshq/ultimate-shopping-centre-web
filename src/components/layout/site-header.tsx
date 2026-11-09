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

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="container-page flex h-16 items-center gap-3 md:gap-6">
        <Logo />
        <div className="hidden max-w-[13rem] min-w-0 lg:block">
          <Suspense fallback={<LocationPickerFallback />}>
            <CurrentLocation />
          </Suspense>
        </div>
        <div className="hidden flex-1 md:block">
          <Suspense fallback={<SearchBarFallback />}>
            <SearchBar />
          </Suspense>
        </div>
        <div className="ml-auto md:ml-0">
          <Suspense fallback={<HeaderActionsFallback />}>
            <HeaderActions />
          </Suspense>
        </div>
      </div>

      {/* Mobile: location and search get their own row for thumb reach. */}
      <div className="container-page space-y-1 pb-3 md:hidden">
        <Suspense fallback={<LocationPickerFallback />}>
          <CurrentLocation className="-ml-2 max-w-full" />
        </Suspense>
        <Suspense fallback={<SearchBarFallback />}>
          <SearchBar />
        </Suspense>
      </div>
      <div className="container-page hidden pb-2 md:block lg:hidden">
        <Suspense fallback={<LocationPickerFallback />}>
          <CurrentLocation className="-ml-2" />
        </Suspense>
      </div>
    </header>
  );
}
