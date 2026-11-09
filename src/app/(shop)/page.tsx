import {
  ArrowRightIcon,
  BadgePercentIcon,
  ClockIcon,
  HeartIcon,
  LayersIcon,
  SearchIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { SectionHeader } from "@/components/common/page-header";
import { SearchBar, SearchBarFallback } from "@/components/layout/search-bar";
import { Button } from "@/components/ui/button";
import { PLATFORM_LIST } from "@/config/platforms";
import { categories, popularSearches } from "@/config/site";
import { searchHref } from "@/lib/routes";

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="container-page space-y-16 py-12">
        <Categories />
        <HowItWorks />
        <Features />
        <CallToAction />
      </div>
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-secondary/70 via-background to-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="container-page relative py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-card">
            <ZapIcon className="size-3.5 text-deal" aria-hidden />
            Live prices from {PLATFORM_LIST.length} platforms, one search
          </span>
          <h1 className="mt-5 text-4xl font-extrabold text-balance sm:text-5xl lg:text-6xl">
            Find the <span className="text-primary">best price</span> before you shop.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-balance text-muted-foreground sm:text-lg">
            Compare groceries and essentials across Blinkit, Zepto, Instamart, BigBasket, JioMart, DMart and Amazon —
            with delivery times for your pincode.
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <Suspense fallback={<SearchBarFallback />}>
              <SearchBar />
            </Suspense>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {popularSearches.slice(0, 6).map((term) => (
                <Link
                  key={term}
                  href={searchHref(term)}
                  className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Comparing prices on</p>
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
              {PLATFORM_LIST.map((platform) => (
                <li key={platform.id} className="flex items-center gap-2 text-sm font-medium">
                  <PlatformLogo platform={platform.id} size="md" />
                  {platform.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Categories() {
  return (
    <section>
      <SectionHeader title="Shop by category" description="Jump straight into price comparisons for everyday essentials." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {categories.map((category) => (
          <Link
            key={category.label}
            href={searchHref(category.query)}
            className="group flex flex-col items-center gap-2 rounded-2xl border bg-card p-4 text-center shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-2xl transition group-hover:scale-110" aria-hidden>
              {category.emoji}
            </span>
            <span className="text-sm font-medium">{category.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: SearchIcon,
    title: "Search once",
    body: "We query every platform at your pincode in parallel — results stream in within seconds.",
  },
  {
    icon: LayersIcon,
    title: "Compare side by side",
    body: "Identical products are matched across platforms, so you see the best price, discount and delivery time at a glance.",
  },
  {
    icon: ShoppingBagIcon,
    title: "Checkout where it's cheapest",
    body: "Build one cart across platforms, then follow the guided checkout to order on each site.",
  },
];

function HowItWorks() {
  return (
    <section>
      <SectionHeader title="How USC works" />
      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="relative rounded-2xl border bg-card p-6 shadow-card">
            <span className="absolute top-5 right-5 font-heading text-4xl font-extrabold text-muted/80" aria-hidden>
              {index + 1}
            </span>
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <step.icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-4 font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const FEATURES = [
  { icon: BadgePercentIcon, title: "Best-deal highlights", body: "Cheapest listing, biggest discount and best value per unit — flagged automatically." },
  { icon: ClockIcon, title: "Delivery ETAs", body: "See whether it arrives in 10 minutes or tomorrow before you decide." },
  { icon: HeartIcon, title: "Wishlist", body: "Save products for later and come back to compare when you're ready." },
  { icon: ShieldCheckIcon, title: "Shop on trusted apps", body: "You always pay on the original platform. USC never handles your payment." },
];

function Features() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map((feature) => (
        <div key={feature.title} className="rounded-2xl border bg-card p-5 shadow-card">
          <feature.icon className="size-5 text-primary" aria-hidden />
          <h3 className="mt-3 text-sm font-semibold">{feature.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{feature.body}</p>
        </div>
      ))}
    </section>
  );
}

function CallToAction() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-12">
      <div aria-hidden className="pointer-events-none absolute -right-20 -bottom-24 size-80 rounded-full bg-deal/30 blur-3xl" />
      <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">Start saving on your next order</h2>
          <p className="mt-2 max-w-xl text-primary-foreground/80">
            Sign in to keep a cart across platforms, save a wishlist and pick up where you left off on any device.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="xl" variant="deal">
            <Link href="/search?q=amul%20butter">
              Try a search <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
          <Button asChild size="xl" variant="secondary">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
