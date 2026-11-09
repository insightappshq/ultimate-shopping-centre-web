import { BadgeCheckIcon, CrownIcon, InfoIcon, SearchXIcon } from "lucide-react";
import Link from "next/link";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { Badge } from "@/components/ui/badge";
import { PLATFORMS } from "@/config/platforms";
import { toSnapshot } from "@/lib/data/schemas";
import { formatPrice } from "@/lib/format";
import type { Comparison, ComparisonRow } from "@/lib/quickcommerce/types";
import { productHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";
import { BuyOnPlatformButton } from "./buy-on-platform-button";
import { DiscountBadge } from "./price";
import { StockStatus } from "./product-meta";

interface Props {
  comparison: Comparison;
  query?: string;
  cartKeys: Set<string>;
}

function cheapestKey(rows: ComparisonRow[]): string | undefined {
  return rows.find((row) => row.offer.available)?.offer.key;
}

function MatchBadge({ row, isReference }: { row: ComparisonRow; isReference: boolean }) {
  if (isReference) return <Badge variant="secondary">Viewing</Badge>;
  return row.match === "exact" ? (
    <Badge variant="success">
      <BadgeCheckIcon /> Same product
    </Badge>
  ) : (
    <Badge variant="outline" title="Closest match — pack size or variant may differ">
      Similar
    </Badge>
  );
}

/** Responsive price comparison: a table on desktop, stacked cards on mobile. */
export function PriceComparison({ comparison, query, cartKeys }: Props) {
  const { rows, reference, missing } = comparison;
  const bestKey = cheapestKey(rows);
  const available = rows.filter((r) => r.offer.available);
  const highest = Math.max(...available.map((r) => r.offer.price));

  return (
    <div className="space-y-3">
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-card md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Prices for {reference.name} across platforms, cheapest first</caption>
          <thead className="bg-muted/60 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">Platform</th>
              <th scope="col" className="px-4 py-3">Listing</th>
              <th scope="col" className="px-4 py-3">Delivery</th>
              <th scope="col" className="px-4 py-3 text-right">Price</th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => {
              const { offer } = row;
              const isBest = offer.key === bestKey;
              const isReference = offer.key === reference.key;
              const extra = isBest || !offer.available ? 0 : offer.price - (available[0]?.offer.price ?? offer.price);
              return (
                <tr key={offer.key} className={cn("align-middle transition", isBest && "bg-success-subtle/60")}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <PlatformLogo platform={offer.platform} size="lg" />
                      <div>
                        <p className="font-semibold">{PLATFORMS[offer.platform].name}</p>
                        {isBest && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                            <CrownIcon className="size-3" aria-hidden /> Best price
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="max-w-xs px-4 py-3.5">
                    <Link
                      href={productHref(offer.platform, offer.productId, query)}
                      className="line-clamp-2 font-medium hover:text-primary hover:underline"
                    >
                      {offer.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {offer.quantity && <span>{offer.quantity}</span>}
                      <MatchBadge row={row} isReference={isReference} />
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium">{offer.eta ?? PLATFORMS[offer.platform].typicalEta}</p>
                    <StockStatus available={offer.available} inventory={offer.inventory} />
                  </td>
                  <td className="px-4 py-3.5 text-right tabular">
                    <p className={cn("font-heading text-lg font-bold", !offer.available && "text-muted-foreground")}>
                      {formatPrice(offer.price)}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 text-xs">
                      {offer.mrp && offer.mrp > offer.price && (
                        <span className="text-muted-foreground line-through">{formatPrice(offer.mrp)}</span>
                      )}
                      <DiscountBadge percent={offer.discountPercent} />
                    </div>
                    {offer.unitPrice && (
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(offer.unitPrice.value)}/{offer.unitPrice.per}
                      </p>
                    )}
                    {extra > 0 && <p className="text-xs font-medium text-destructive">+{formatPrice(extra)}</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-2">
                      <BuyOnPlatformButton platform={offer.platform} href={offer.deeplink} compact size="lg" />
                      <AddToCartButton
                        product={toSnapshot(offer)}
                        inCart={cartKeys.has(offer.key)}
                        disabled={!offer.available}
                        size="lg"
                        variant={isBest ? "default" : "secondary"}
                        label="Add"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => {
          const { offer } = row;
          const isBest = offer.key === bestKey;
          return (
            <li
              key={offer.key}
              className={cn("rounded-2xl border bg-card p-4 shadow-card", isBest && "border-success/50 bg-success-subtle/50")}
            >
              <div className="flex items-start gap-3">
                <PlatformLogo platform={offer.platform} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{PLATFORMS[offer.platform].shortName}</p>
                    <p className="font-heading text-lg font-bold tabular">{formatPrice(offer.price)}</p>
                  </div>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {offer.name}
                    {offer.quantity ? ` · ${offer.quantity}` : ""}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {isBest && (
                      <Badge variant="success">
                        <CrownIcon /> Best price
                      </Badge>
                    )}
                    <MatchBadge row={row} isReference={offer.key === reference.key} />
                    <DiscountBadge percent={offer.discountPercent} />
                    <span className="text-xs text-muted-foreground">{offer.eta ?? PLATFORMS[offer.platform].typicalEta}</span>
                    {!offer.available && <StockStatus available={false} />}
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <BuyOnPlatformButton platform={offer.platform} href={offer.deeplink} size="lg" />
                <AddToCartButton
                  product={toSnapshot(offer)}
                  inCart={cartKeys.has(offer.key)}
                  disabled={!offer.available}
                  size="lg"
                  variant={isBest ? "default" : "secondary"}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {available.length > 1 && highest > available[0].offer.price && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <InfoIcon className="size-4 shrink-0 text-primary" aria-hidden />
          Prices for this product vary by up to{" "}
          <strong className="text-foreground">{formatPrice(highest - available[0].offer.price)}</strong> across platforms.
        </p>
      )}

      {missing.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          <SearchXIcon className="size-4" aria-hidden />
          Not found on
          {missing.map((platform) => (
            <span key={platform} className="inline-flex items-center gap-1 font-medium text-foreground">
              <PlatformLogo platform={platform} size="xs" />
              {PLATFORMS[platform].shortName}
            </span>
          ))}
          <span>at your location.</span>
        </div>
      )}
    </div>
  );
}
