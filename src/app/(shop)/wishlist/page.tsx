import { HeartIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { DiscountBadge, Price } from "@/components/product/price";
import { ProductCardSkeleton } from "@/components/product/product-card";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { WishlistCardActions } from "@/components/wishlist/wishlist-card-actions";
import { PLATFORMS } from "@/config/platforms";
import { requireUser } from "@/lib/auth/dal";
import { getWishlist } from "@/lib/data/wishlist";
import { pluralize } from "@/lib/format";
import { productHref } from "@/lib/routes";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default function WishlistPage() {
  return (
    <div className="container-page py-6 sm:py-8">
      <Suspense fallback={<WishlistSkeleton />}>
        <WishlistContent />
      </Suspense>
    </div>
  );
}

const savedOn = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

async function WishlistContent() {
  const user = await requireUser("/wishlist");
  const items = await getWishlist(user.id);

  if (!items.length) {
    return (
      <EmptyState
        icon={HeartIcon}
        title="Your wishlist is empty"
        description="Tap the heart on any product to save it here and compare prices later."
      >
        <Button asChild size="xl">
          <Link href="/search">Discover products</Link>
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Wishlist" description={`${pluralize(items.length, "saved item")} · prices shown as of when you saved them`} />
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const discount = item.mrp && item.mrp > item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;
          return (
            <li key={item.id}>
              <article className="relative flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-card transition-shadow hover:shadow-elevated">
                <div className="relative aspect-square bg-white">
                  <ProductImage src={item.image} alt={item.name} />
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-card/95 py-0.5 pr-2 pl-0.5 text-[0.68rem] font-medium shadow-sm">
                    <PlatformLogo platform={item.platform} size="xs" className="rounded-full" />
                    {PLATFORMS[item.platform].shortName}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3.5">
                  <div className="min-w-0">
                    {item.brand && <p className="truncate text-[0.7rem] font-semibold text-muted-foreground">{item.brand}</p>}
                    <h2 className="line-clamp-2 text-sm font-medium">{item.name}</h2>
                    {item.packSize && <p className="text-xs text-muted-foreground">{item.packSize}</p>}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <Price price={item.price} mrp={item.mrp} />
                    <DiscountBadge percent={discount} />
                  </div>
                  <p className="text-[0.68rem] text-muted-foreground">Saved {savedOn.format(new Date(item.savedAt))}</p>
                  <Button variant="secondary" size="sm" asChild className="relative z-10">
                    <Link href={productHref(item.platform, item.productId, item.name)}>Compare live prices</Link>
                  </Button>
                  <WishlistCardActions itemId={item.id} />
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function WishlistSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-40 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
