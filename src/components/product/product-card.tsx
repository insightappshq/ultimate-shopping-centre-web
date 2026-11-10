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

/**
 * Flat product tile. Hierarchy, top to bottom: photo → name and pack → price
 * (the hero) → where it's from → what it costs elsewhere. One small action
 * per tile; the whole tile links to the product page.
 */
function Tile({
  href,
  image,
  name,
  unavailable,
  wishlist,
  children,
}: {
  href: string;
  image: string | null;
  name: string;
  unavailable?: boolean;
  wishlist: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="group/tile relative flex h-full flex-col rounded-lg border bg-card transition-colors hover:border-foreground/25 focus-within:border-foreground/25">
      <div className="relative aspect-[5/4] overflow-hidden rounded-t-lg border-b border-border/60 bg-white">
        <ProductImage
          src={image}
          alt={name}
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 240px"
          className={cn("p-3 transition-transform duration-300 group-hover/tile:scale-[1.02]", unavailable && "opacity-40 grayscale")}
        />
        <div className="absolute top-1.5 right-1.5 z-10 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/tile:opacity-100 sm:group-focus-within/tile:opacity-100 [&:has([aria-pressed=true])]:opacity-100">
          {wishlist}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3">{children}</div>
      {/* Whole tile is the link; interactive controls sit above it (z-10). */}
      <Link
        href={href}
        prefetch={false}
        aria-label={name}
        className="absolute inset-0 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring"
      />
    </article>
  );
}

function Title({ brand, name, quantity }: { brand: string | null; name: string; quantity: string | null }) {
  return (
    <div className="min-w-0">
      <h3 className="line-clamp-2 text-sm leading-snug font-medium text-foreground">
        {brand && !name.toLowerCase().startsWith(brand.toLowerCase()) && (
          <span className="text-muted-foreground">{brand} </span>
        )}
        {name}
      </h3>
      {quantity && <p className="mt-0.5 text-xs text-muted-foreground">{quantity}</p>}
    </div>
  );
}

function PriceRow({
  offer,
  inCart,
}: {
  offer: Offer;
  inCart: boolean;
}) {
  return (
    <div className="mt-auto flex items-end justify-between gap-2 pt-3">
      <div className="min-w-0">
        <Price price={offer.price} mrp={offer.mrp} muted={!offer.available} />
        <div className="mt-0.5 flex h-4 items-center gap-2">
          {offer.available ? (
            <DiscountBadge percent={offer.discountPercent} />
          ) : (
            <span className="text-xs font-medium text-destructive">Out of stock</span>
          )}
        </div>
      </div>
      <div className="relative z-10">
        <AddToCartButton product={toSnapshot(offer)} inCart={inCart} disabled={!offer.available} compact />
      </div>
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
  const saving = group.highestPrice - best.price;

  return (
    <Tile
      href={productHref(best.platform, best.productId, query)}
      image={group.image}
      name={group.name}
      unavailable={!best.available}
      wishlist={<WishlistButton product={toSnapshot(best)} saved={state.savedKeys.has(best.key)} />}
    >
      <Title brand={group.brand} name={group.name} quantity={group.quantity} />

      <PriceRow offer={best} inCart={state.cartKeys.has(best.key)} />

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-dashed pt-2.5 text-xs">
        <span className="flex min-w-0 items-center gap-1.5 font-medium">
          <PlatformLogo platform={best.platform} size="xs" />
          <span className="truncate">{PLATFORMS[best.platform].shortName}</span>
        </span>
        {saving >= 1 ? (
          <span className="shrink-0 font-semibold text-success tabular">Saves {formatPrice(saving)}</span>
        ) : (
          <Eta eta={best.eta} className="shrink-0" />
        )}
      </div>

      {others.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs" aria-label="Also available on">
          {others.slice(0, 3).map((offer) => (
            <li key={offer.listingId} className="flex items-center gap-1 text-muted-foreground">
              <PlatformLogo platform={offer.platform} size="xs" />
              <span className={cn("tabular", !offer.available && "line-through")}>{formatPrice(offer.price)}</span>
            </li>
          ))}
          {others.length > 3 && <li className="text-muted-foreground">+{others.length - 3}</li>}
        </ul>
      )}
    </Tile>
  );
}

export function OfferCard({ offer, query, state }: { offer: Offer; query?: string; state: CardState }) {
  return (
    <Tile
      href={productHref(offer.platform, offer.productId, query)}
      image={offer.image}
      name={offer.name}
      unavailable={!offer.available}
      wishlist={<WishlistButton product={toSnapshot(offer)} saved={state.savedKeys.has(offer.key)} />}
    >
      <Title brand={offer.brand} name={offer.name} quantity={offer.quantity} />
      <PriceRow offer={offer} inCart={state.cartKeys.has(offer.key)} />
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-dashed pt-2.5 text-xs">
        <span className="flex min-w-0 items-center gap-1.5 font-medium">
          <PlatformLogo platform={offer.platform} size="xs" />
          <span className="truncate">{PLATFORMS[offer.platform].shortName}</span>
        </span>
        {offer.unitPrice ? (
          <span className="shrink-0 text-muted-foreground tabular">
            {formatPrice(offer.unitPrice.value)}/{offer.unitPrice.per}
          </span>
        ) : (
          <Rating rating={offer.rating} />
        )}
      </div>
    </Tile>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-lg border bg-card" aria-hidden>
      <div className="aspect-[5/4] animate-pulse rounded-t-lg bg-muted" />
      <div className="space-y-2 p-3">
        <div className="h-3.5 w-full animate-pulse rounded-sm bg-muted" />
        <div className="h-3.5 w-2/3 animate-pulse rounded-sm bg-muted" />
        <div className="h-6 w-1/2 animate-pulse rounded-sm bg-muted" />
        <div className="h-3 w-full animate-pulse rounded-sm bg-muted" />
      </div>
    </div>
  );
}
