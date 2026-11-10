import { MapPinIcon, PackageXIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { cache, Suspense } from "react";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { EmptyState } from "@/components/common/empty-state";
import { SectionHeader } from "@/components/common/page-header";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { BestDeals } from "@/components/product/best-deals";
import { BuyingOptions } from "@/components/product/buying-options";
import { BuyOnPlatformButton } from "@/components/product/buy-on-platform-button";
import { PriceComparison } from "@/components/product/price-comparison";
import { AssuranceBadges, FoodMark, ProductDetails } from "@/components/product/product-details";
import { DiscountBadge, Price } from "@/components/product/price";
import { OfferCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { Eta, Rating, StockStatus } from "@/components/product/product-meta";
import { WishlistButton } from "@/components/product/wishlist-button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { PLATFORMS, type PlatformId } from "@/config/platforms";
import { toSnapshot } from "@/lib/data/schemas";
import { requireUser } from "@/lib/auth/dal";
import { getUserProductState } from "@/lib/data/user-product-state";
import { fallbackTo } from "@/lib/errors";
import { formatPrice } from "@/lib/format";
import { getLocation } from "@/lib/location.server";
import { compareProduct, getProduct } from "@/lib/quickcommerce/service";
import { productHref, searchHref } from "@/lib/routes";

export interface ProductRouteProps {
  params: Promise<{ platform: PlatformId; id: string }>;
  searchParams: Promise<{ q?: string }>;
}

/** Request-scoped loaders so the hero and comparison share one fetch. */
const loadProduct = cache(async (platform: PlatformId, id: string) => {
  await requireUser(`/product/${platform}/${encodeURIComponent(id)}`);
  const location = await getLocation();
  const product = await getProduct(platform, id, location);
  return { product, location };
});

const loadComparison = cache(async (platform: PlatformId, id: string, q: string | undefined) => {
  const { product, location } = await loadProduct(platform, id);
  if (!product) return null;
  return compareProduct(product, location, { searchQuery: q });
});

export async function ProductBreadcrumb({ params, searchParams }: ProductRouteProps) {
  const [{ platform, id }, { q }] = await Promise.all([params, searchParams]);
  const { product } = await loadProduct(platform, id).catch(fallbackTo({ product: null }));

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={q ? searchHref(q) : "/search"}>{q ? `“${q}”` : "Search"}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {product && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate">{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export async function ProductHero({ params, searchParams }: ProductRouteProps) {
  const [{ platform, id }, { q }] = await Promise.all([params, searchParams]);
  const [{ product, location }, userState] = await Promise.all([loadProduct(platform, id), getUserProductState()]);

  if (!product) {
    return (
      <EmptyState
        icon={PackageXIcon}
        title="This product isn't available here"
        description={`${PLATFORMS[platform].name} doesn't list this item for ${location.label} (${location.pincode}) right now. Try another location or search for alternatives.`}
      >
        <Button asChild>
          <Link href={q ? searchHref(q) : "/search"}>Back to results</Link>
        </Button>
      </EmptyState>
    );
  }

  const meta = PLATFORMS[product.platform];
  const snapshot = toSnapshot(product);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
      <ProductGallery images={product.images} name={product.name} />

      <div className="space-y-5">
        <div className="space-y-2.5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <PlatformLogo platform={product.platform} size="xs" />
            {meta.name}
            {product.brand && (
              <>
                <span aria-hidden className="h-3 w-px bg-border" />
                <span className="font-medium text-foreground">{product.brand}</span>
              </>
            )}
          </p>
          <h1 className="text-[1.75rem] text-balance sm:text-[2rem]">{product.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <FoodMark labels={product.info.dietaryLabels} />
            {product.quantity && <span className="font-medium">{product.quantity}</span>}
            <Rating rating={product.rating} count={product.ratingCount} />
            <StockStatus available={product.available} inventory={product.inventory} />
            <Eta eta={product.eta ?? meta.typicalEta} />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Price on {meta.shortName}</p>
              <div className="mt-1.5 flex items-baseline gap-2.5">
                <Price price={product.price} mrp={product.mrp} size="xl" />
                <DiscountBadge percent={product.discountPercent} className="text-xs" />
              </div>
              {product.unitPrice && (
                <p className="mt-1 text-xs text-muted-foreground tabular">
                  {formatPrice(product.unitPrice.value)} per {product.unitPrice.per}, inclusive of all taxes
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
            <AddToCartButton
              product={snapshot}
              inCart={userState.cartKeys.has(product.key)}
              disabled={!product.available}
              size="xl"
              className="w-full"
              label={product.available ? "Add to cart" : "Out of stock"}
            />
            <WishlistButton product={snapshot} saved={userState.savedKeys.has(product.key)} variant="full" />
          </div>
          <BuyOnPlatformButton platform={product.platform} href={product.deeplink} size="xl" className="mt-2 w-full" />
          {product.info.badges.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <AssuranceBadges badges={product.info.badges} />
            </div>
          )}
        </div>

        <Suspense fallback={<div className="h-20 animate-pulse rounded-md bg-muted" />}>
          <HeroDeals platform={platform} id={id} q={q} />
        </Suspense>

        {product.variants.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold">Other pack sizes on {meta.shortName}</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((variant) => (
                <Link
                  key={variant.listingId}
                  href={productHref(variant.platform, variant.productId, q)}
                  className="rounded-md border bg-card px-3 py-2 text-sm transition hover:border-primary"
                >
                  <span className="block font-medium">{variant.quantity ?? variant.name}</span>
                  <span className="text-xs text-muted-foreground tabular">{formatPrice(variant.price)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:gap-5">
          <span className="inline-flex items-center gap-1.5">
            <MapPinIcon className="size-3.5" aria-hidden /> Prices for {location.label}, {location.pincode}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheckIcon className="size-3.5" aria-hidden /> You pay securely on {meta.name}
          </span>
        </div>
      </div>
    </div>
  );
}

async function HeroDeals({ platform, id, q }: { platform: PlatformId; id: string; q?: string }) {
  const [comparison, { product }, userState] = await Promise.all([
    loadComparison(platform, id, q).catch(fallbackTo(null)),
    loadProduct(platform, id),
    getUserProductState(),
  ]);
  if (!comparison || !product) return null;
  return (
    <div className="space-y-3">
      <BuyingOptions comparison={comparison} current={product} query={q} cartKeys={userState.cartKeys} />
      {comparison.rows.length > 1 && <BestDeals comparison={comparison} />}
    </div>
  );
}

export async function ComparisonSection({ params, searchParams }: ProductRouteProps) {
  const [{ platform, id }, { q }] = await Promise.all([params, searchParams]);
  const [comparison, { product }, userState] = await Promise.all([
    loadComparison(platform, id, q),
    loadProduct(platform, id),
    getUserProductState(),
  ]);
  if (!comparison || !product) return null;

  const cardState = { savedKeys: userState.savedKeys, cartKeys: userState.cartKeys };
  const platformsCompared = comparison.rows.length;

  return (
    <div className="space-y-12">
      <section aria-label="Compare prices across platforms">
        <SectionHeader
          title="Compare prices across platforms"
          description={
            platformsCompared > 1
              ? `Found on ${platformsCompared} platforms, cheapest first. Prices update live for your location.`
              : "We couldn't find this exact product on other platforms near you."
          }
        />
        <PriceComparison comparison={comparison} query={q} cartKeys={userState.cartKeys} />
      </section>

      <ProductDetails product={product} />

      {comparison.related.length > 0 && (
        <section aria-label="You may also like">
          <SectionHeader title="You may also like" />
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {comparison.related.slice(0, 6).map((offer) => (
              <li key={offer.listingId}>
                <OfferCard offer={offer} query={q} state={cardState} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function ProductHeroSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="aspect-square animate-pulse rounded-lg bg-muted" />
      <div className="space-y-4">
        <div className="h-5 w-40 animate-pulse rounded-sm bg-muted" />
        <div className="h-9 w-full animate-pulse rounded bg-muted" />
        <div className="h-9 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export function ComparisonSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-6 w-72 animate-pulse rounded bg-muted" />
      <p className="text-sm text-muted-foreground">Checking prices on every platform…</p>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
