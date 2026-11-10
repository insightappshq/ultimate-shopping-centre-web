import { ClockIcon, HeartIcon, LogOutIcon, MailIcon, PackageCheckIcon, PhoneIcon, ShoppingCartIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { signOutAction } from "@/actions/auth";
import { ClearHistoryButton, NameForm } from "@/components/account/account-forms";
import { PageHeader } from "@/components/common/page-header";
import { LocationPicker } from "@/components/layout/location-picker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/dal";
import { getAccountStats, getProfile, getRecentSearches } from "@/lib/data/profile";
import { formatPhone, initials } from "@/lib/format";
import { getLocation } from "@/lib/location.server";
import { searchHref } from "@/lib/routes";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default function AccountPage() {
  return (
    <div className="container-page py-6 sm:py-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
        <AccountContent />
      </Suspense>
    </div>
  );
}

async function AccountContent() {
  const user = await requireUser("/account");
  const [profile, stats, searches, location] = await Promise.all([
    getProfile(user.id),
    getAccountStats(user.id),
    getRecentSearches(user.id),
    getLocation(),
  ]);
  const name = profile?.fullName ?? user.name ?? "";

  const tiles = [
    { label: "In cart", value: stats.cartPending, icon: ShoppingCartIcon, href: "/cart" },
    { label: "Purchased", value: stats.cartOrdered, icon: PackageCheckIcon, href: "/cart" },
    { label: "Wishlist", value: stats.wishlist, icon: HeartIcon, href: "/wishlist" },
    { label: "Searches", value: stats.searches, icon: ClockIcon, href: "/search" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your account"
        actions={
          <form action={signOutAction}>
            <Button variant="outline" size="lg" type="submit">
              <LogOutIcon data-icon="inline-start" /> Sign out
            </Button>
          </form>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="space-y-5 rounded-lg border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-12 rounded-md after:rounded-md">
              <AvatarFallback className="rounded-md bg-secondary text-base font-semibold text-secondary-foreground">
                {initials({ name, email: user.email, phone: user.phone })}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-lg font-semibold">
                {name || "Shopper"}
                {profile?.isDemo && <Badge variant="secondary">Demo</Badge>}
              </p>
              <div className="space-y-0.5 text-sm text-muted-foreground">
                {user.email && (
                  <p className="flex items-center gap-1.5">
                    <MailIcon className="size-3.5" aria-hidden /> {user.email}
                  </p>
                )}
                {user.phone && (
                  <p className="flex items-center gap-1.5">
                    <PhoneIcon className="size-3.5" aria-hidden /> {formatPhone(user.phone)}
                  </p>
                )}
              </div>
            </div>
          </div>
          <NameForm initialName={name} />
          <div className="space-y-2">
            <p className="text-sm font-medium">Delivery location</p>
            <div className="rounded-md border p-1">
              <LocationPicker location={location} className="w-full" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border">
            {tiles.map((tile) => (
              <Link
                key={tile.label}
                href={tile.href}
                className="bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <tile.icon className="size-4 text-muted-foreground" aria-hidden />
                <p className="price mt-2 text-2xl">{tile.value}</p>
                <p className="text-xs text-muted-foreground">{tile.label}</p>
              </Link>
            ))}
          </div>

          <div className="rounded-lg border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Recent searches</h2>
              {searches.length > 0 && <ClearHistoryButton />}
            </div>
            {searches.length ? (
              <div className="flex flex-wrap gap-2">
                {searches.map((query) => (
                  <Link
                    key={query}
                    href={searchHref(query)}
                    className="inline-flex h-8 items-center rounded-md border bg-card px-3 text-sm capitalize transition-colors hover:border-foreground/30"
                  >
                    {query}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Your searches will appear here.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
