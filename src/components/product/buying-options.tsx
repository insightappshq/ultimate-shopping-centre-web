import { CircleCheckIcon, TagIcon, TrendingDownIcon } from "lucide-react";
import Link from "next/link";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { Button } from "@/components/ui/button";
import { PLATFORMS } from "@/config/platforms";
import { toSnapshot } from "@/lib/data/schemas";
import { formatPrice } from "@/lib/format";
import { exactRows } from "@/lib/quickcommerce/matching";
import type { Comparison, Offer } from "@/lib/quickcommerce/types";
import { productHref } from "@/lib/routes";
import { AddToCartButton } from "./add-to-cart-button";
import { BuyOnPlatformButton } from "./buy-on-platform-button";
import { ProductImage } from "./product-image";

/**
 * "Where should I buy this?" — the cheapest way to buy *this* product, and,
 * separately and clearly labelled, a cheaper *different* product in the same
 * pack size. Shown in the product hero so the best option is never buried in
 * the comparison table.
 */
export function BuyingOptions({
  comparison,
  current,
  query,
  cartKeys,
}: {
  comparison: Comparison;
  current: Offer;
  query?: string;
  cartKeys: Set<string>;
}) {
  const sameProduct = exactRows(comparison.rows).map((row) => row.offer);
  const lowest = sameProduct[0] ?? null;
  const alternative = comparison.alternative;
  const otherPlatforms = new Set(sameProduct.map((o) => o.platform)).size;

  if (!lowest && !alternative) return null;

  return (
    <section aria-label="Best way to buy" className="overflow-hidden rounded-lg border bg-card">
      {lowest && lowest.listingId === current.listingId ? (
        <p className="flex items-center gap-2 px-4 py-3 text-sm">
          <CircleCheckIcon className="size-4 shrink-0 text-success" aria-hidden />
          {otherPlatforms > 1
            ? `This is the lowest price for this product across ${otherPlatforms} platforms.`
            : "We didn't find this product cheaper on another platform near you."}
        </p>
      ) : lowest ? (
        <OptionRow
          icon={<TrendingDownIcon className="size-4 text-success" aria-hidden />}
          title="Lowest price for this product"
          offer={lowest}
          detail={`${formatPrice(current.price - lowest.price)} less than on ${PLATFORMS[current.platform].shortName}`}
          cartKeys={cartKeys}
        />
      ) : null}

      {alternative && (
        <div className="border-t">
          <OptionRow
            icon={<TagIcon className="size-4 text-primary" aria-hidden />}
            title="Cheaper alternative, different product"
            offer={alternative}
            detail={`${formatPrice((lowest ?? current).price - alternative.price)} less, same ${alternative.quantity ?? "pack"}`}
            cartKeys={cartKeys}
            href={productHref(alternative.platform, alternative.productId, query)}
            showName
          />
        </div>
      )}
    </section>
  );
}

function OptionRow({
  icon,
  title,
  offer,
  detail,
  cartKeys,
  href,
  showName = false,
}: {
  icon: React.ReactNode;
  title: string;
  offer: Offer;
  detail: string;
  cartKeys: Set<string>;
  href?: string;
  showName?: boolean;
}) {
  return (
    <div className="space-y-3 p-4">
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {title}
      </p>
      <div className="flex items-center gap-3">
        {showName && (
          <div className="relative size-12 shrink-0 overflow-hidden rounded-md border bg-white">
            <ProductImage src={offer.image} alt={offer.name} sizes="48px" className="p-1" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {showName &&
            (href ? (
              <Link href={href} className="line-clamp-1 text-sm font-medium hover:text-primary hover:underline">
                {offer.name}
              </Link>
            ) : (
              <p className="line-clamp-1 text-sm font-medium">{offer.name}</p>
            ))}
          <p className="flex items-center gap-1.5 text-sm">
            <PlatformLogo platform={offer.platform} size="xs" />
            <span className="font-medium">{PLATFORMS[offer.platform].shortName}</span>
            <span className="text-muted-foreground">{offer.eta ?? PLATFORMS[offer.platform].typicalEta}</span>
          </p>
          <p className="text-xs font-medium text-success tabular">{detail}</p>
        </div>
        <p className="price shrink-0 text-xl">{formatPrice(offer.price)}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {href ? (
          <Button variant="outline" asChild>
            <Link href={href}>View product</Link>
          </Button>
        ) : (
          <BuyOnPlatformButton platform={offer.platform} href={offer.deeplink} />
        )}
        <AddToCartButton product={toSnapshot(offer)} inCart={cartKeys.has(offer.key)} label="Add to cart" />
      </div>
    </div>
  );
}
