import Link from "next/link";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { PLATFORMS } from "@/config/platforms";
import { toSnapshot } from "@/lib/data/schemas";
import { formatPrice } from "@/lib/format";
import type { Offer, ProductGroup } from "@/lib/quickcommerce/types";
import { productHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";
import { DiscountBadge, Price } from "./price";
import { ProductImage } from "./product-image";
import { Eta, Rating } from "./product-meta";
import { WishlistButton } from "./wishlist-button";

export interface CardState {
  savedKeys: Set<string>;
  cartKeys: Set<string>;
}

function CardShell({
  href,
  image,
  name,
  overlay,
  topBadge,
  children,
  unavailable,
}: {
  href: string;
  image: string | null;
  name: string;
  overlay?: React.ReactNode;
  topBadge?: React.ReactNode;
  children: React.ReactNode;
  unavailable?: boolean;
}) {
  return (
    <article className="group/card relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-shadow hover:shadow-elevated">
      <div className="relative aspect-square bg-white">
        <ProductImage
          src={image}
          alt={name}
          className={cn("transition-transform duration-300 group-hover/card:scale-[1.03]", unavailable && "opacity-50 grayscale")}
        />
        {topBadge && <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">{topBadge}</div>}
        {overlay && <div className="absolute top-2.5 right-2.5 z-10">{overlay}</div>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-3.5">{children}</div>
      {/* Whole card is clickable; interactive children sit above via z-10. */}
      <Link href={href} className="absolute inset-0 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring" aria-label={name} prefetch={false} />
    </article>
  );
}

function Title({ brand, name, quantity }: { brand: string | null; name: string; quantity: string | null }) {
  return (
    <div className="min-w-0">
      {brand && <p className="truncate text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">{brand}</p>}
      <h3 className="line-clamp-2 text-sm leading-snug font-medium">{name}</h3>
      {quantity && <p className="mt-0.5 text-xs text-muted-foreground">{quantity}</p>}
    </div>
  );
}

export function ProductGroupCard({
  group,
  query,
  state,
}: {
  group: ProductGroup;
  query?: string;
  state: CardState;
}) {
  const { best } = group;
  const others = group.offers.filter((o) => o.listingId !== best.listingId);
  const savings = group.offers.length > 1 ? group.highestPrice - best.price : 0;

  return (
    <CardShell
      href={productHref(best.platform, best.productId, query)}
      image={group.image}
      name={group.name}
      unavailable={!best.available}
      topBadge={
        <>
          {group.offers.length > 1 && savings > 0 && (
            <span className="rounded-md bg-deal px-1.5 py-0.5 text-[0.68rem] font-bold text-deal-foreground shadow-sm">
              Save {formatPrice(savings)}
            </span>
          )}
          <DiscountBadge percent={best.discountPercent} />
        </>
      }
      overlay={<WishlistButton product={toSnapshot(best)} saved={state.savedKeys.has(best.key)} />}
    >
      <Title brand={group.brand} name={group.name} quantity={group.quantity} />

      <div className="mt-auto space-y-2">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="flex items-center gap-1 text-[0.68rem] font-medium text-muted-foreground">
              <PlatformLogo platform={best.platform} size="xs" />
              {group.offers.length > 1 ? "Best on" : "On"} {PLATFORMS[best.platform].shortName}
            </p>
            <Price price={best.price} mrp={best.mrp} size="md" />
          </div>
          <Rating rating={group.rating} />
        </div>

        {others.length > 0 && (
          <ul className="space-y-1 rounded-lg bg-muted/60 p-2 text-xs">
            {others.slice(0, 2).map((offer) => (
              <li key={offer.listingId} className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  <PlatformLogo platform={offer.platform} size="xs" />
                  <span className="truncate text-muted-foreground">{PLATFORMS[offer.platform].shortName}</span>
                </span>
                <span className={cn("font-medium tabular", !offer.available && "text-muted-foreground line-through")}>
                  {formatPrice(offer.price)}
                </span>
              </li>
            ))}
            {others.length > 2 && (
              <li className="text-[0.68rem] font-medium text-primary">+{others.length - 2} more platforms</li>
            )}
          </ul>
        )}

        <div className="relative z-10">
          <AddToCartButton
            product={toSnapshot(best)}
            inCart={state.cartKeys.has(best.key)}
            disabled={!best.available}
            variant={state.cartKeys.has(best.key) ? "secondary" : "default"}
            className="w-full"
            label={best.available ? "Add to cart" : "Out of stock"}
          />
        </div>
      </div>
    </CardShell>
  );
}

export function OfferCard({ offer, query, state }: { offer: Offer; query?: string; state: CardState }) {
  return (
    <CardShell
      href={productHref(offer.platform, offer.productId, query)}
      image={offer.image}
      name={offer.name}
      unavailable={!offer.available}
      topBadge={<DiscountBadge percent={offer.discountPercent} />}
      overlay={<WishlistButton product={toSnapshot(offer)} saved={state.savedKeys.has(offer.key)} />}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium">
          <PlatformLogo platform={offer.platform} size="xs" />
          {PLATFORMS[offer.platform].shortName}
        </span>
        <Eta eta={offer.eta} />
      </div>
      <Title brand={offer.brand} name={offer.name} quantity={offer.quantity} />
      <div className="mt-auto space-y-2">
        <div className="flex items-end justify-between gap-2">
          <div>
            <Price price={offer.price} mrp={offer.mrp} />
            {offer.unitPrice && (
              <p className="text-[0.68rem] text-muted-foreground tabular">
                {formatPrice(offer.unitPrice.value)} / {offer.unitPrice.per}
              </p>
            )}
          </div>
          <Rating rating={offer.rating} />
        </div>
        <div className="relative z-10">
          <AddToCartButton
            product={toSnapshot(offer)}
            inCart={state.cartKeys.has(offer.key)}
            disabled={!offer.available}
            variant={state.cartKeys.has(offer.key) ? "secondary" : "default"}
            className="w-full"
            label={offer.available ? "Add to cart" : "Out of stock"}
          />
        </div>
      </div>
    </CardShell>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="space-y-2 p-3.5">
        <div className="h-2.5 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-8 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
