import { ArrowRightIcon, ClockIcon, HeartIcon, ShoppingCartIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { SectionHeader } from "@/components/common/page-header";
import { SearchBar, SearchBarFallback } from "@/components/layout/search-bar";
import { categories } from "@/config/categories";
import { PLATFORM_LIST } from "@/config/platforms";
import { popularSearches } from "@/config/site";
import { requireUser } from "@/lib/auth/dal";
import { getAccountStats, getRecentSearches } from "@/lib/data/profile";
import { fallbackTo } from "@/lib/errors";
import { getLocation } from "@/lib/location.server";
import { searchHref } from "@/lib/routes";

export const metadata: Metadata = { title: "Home", robots: { index: false } };

export default function AppHomePage() {
  return (
    <div className="container-page space-y-10 py-6 sm:py-10">
      {/* Never add overflow-hidden here: it would clip the search suggestions dropdown. */}
      <section className="relative z-10 border-b pb-8">
        <div className="max-w-2xl">
          <Suspense fallback={<div className="h-9 w-64 animate-pulse rounded bg-muted" />}>
            <Greeting />
          </Suspense>
          <p className="mt-2 text-muted-foreground">
            Search once to compare live prices, stock and delivery times across {PLATFORM_LIST.length} platforms.
          </p>
          <div className="mt-6">
            <Suspense fallback={<SearchBarFallback variant="prominent" />}>
              <SearchBar autoFocus variant="prominent" />
            </Suspense>
          </div>
          <Suspense fallback={<div className="mt-4 h-7" />}>
            <SearchShortcuts />
          </Suspense>
        </div>
      </section>

      <section>
        <SectionHeader title="Shop by category" description="Start a comparison with one tap." />
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {categories.map((category) => (
            <li key={category.label}>
              <Link
                href={searchHref(category.query)}
                className="flex h-full items-center gap-3 rounded-lg border bg-card px-3 py-3 text-sm font-medium transition-colors hover:border-foreground/25"
              >
                <category.icon className="size-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
                <span className="min-w-0 truncate">{category.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2"><div className="h-28 animate-pulse rounded-lg bg-muted" /><div className="h-28 animate-pulse rounded-lg bg-muted" /></div>}>
        <QuickLinks />
      </Suspense>

      <section>
        <SectionHeader title="Platforms we compare" description="Availability depends on your pincode." />
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4 lg:grid-cols-7">
          {PLATFORM_LIST.map((platform) => (
            <li key={platform.id} className="flex items-center gap-2.5 bg-card p-3">
              <PlatformLogo platform={platform.id} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{platform.shortName}</p>
                <p className="text-xs text-muted-foreground">{platform.typicalEta}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

async function Greeting() {
  const user = await requireUser("/home");
  const firstName = user.name?.trim().split(/\s+/)[0];
  return (
    <h1 className="text-[2rem] sm:text-[2.5rem]">
      {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
    </h1>
  );
}

async function SearchShortcuts() {
  const user = await requireUser("/home");
  const [recent, location] = await Promise.all([getRecentSearches(user.id).catch(fallbackTo([])), getLocation()]);
  const terms = recent.length ? recent.slice(0, 6) : popularSearches.slice(0, 6);

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <ClockIcon className="size-3.5" aria-hidden />
          {recent.length ? "Recent" : "Popular"}
        </span>
        {terms.map((term) => (
          <Link
            key={term}
            href={searchHref(term)}
            className="inline-flex h-7 items-center rounded-md border bg-card px-2.5 text-xs font-medium capitalize transition-colors hover:border-foreground/30"
          >
            {term}
          </Link>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Showing prices for <span className="font-medium text-foreground">{location.label}</span>,{" "}
        <span className="font-medium text-foreground tabular">{location.pincode}</span>
      </p>
    </div>
  );
}

async function QuickLinks() {
  const user = await requireUser("/home");
  const stats = await getAccountStats(user.id).catch(fallbackTo({ cartPending: 0, cartOrdered: 0, wishlist: 0, searches: 0 }));
  const links = [
    {
      href: "/cart",
      icon: ShoppingCartIcon,
      title: "Your cart",
      body: stats.cartPending
        ? `${stats.cartPending} item${stats.cartPending === 1 ? "" : "s"} waiting to be ordered`
        : "Add the best deals you find, from any platform",
    },
    {
      href: "/wishlist",
      icon: HeartIcon,
      title: "Your wishlist",
      body: stats.wishlist
        ? `${stats.wishlist} saved item${stats.wishlist === 1 ? "" : "s"} — check today's prices`
        : "Save products to compare again later",
    },
  ];
  return (
    <section className="grid gap-2 sm:grid-cols-2 sm:gap-3" aria-label="Your lists">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="group flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-foreground/25"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
            <link.icon className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{link.title}</span>
            <span className="block text-sm text-muted-foreground">{link.body}</span>
          </span>
          <ArrowRightIcon className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
        </Link>
      ))}
    </section>
  );
}
