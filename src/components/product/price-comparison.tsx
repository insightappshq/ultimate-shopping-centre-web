import { CheckIcon, InfoIcon, SearchXIcon } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { PLATFORMS } from "@/config/platforms";
import { toSnapshot } from "@/lib/data/schemas";
import { formatPrice } from "@/lib/format";
import { exactRows } from "@/lib/quickcommerce/matching";
import type { Comparison, ComparisonRow, Offer } from "@/lib/quickcommerce/types";
import { quantityKey } from "@/lib/quickcommerce/units";
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

function MatchLabel({ row, reference }: { row: ComparisonRow; reference: Offer }) {
  if (row.offer.listingId === reference.listingId) {
    return <span className="text-xs text-muted-foreground">This listing</span>;
  }
  if (row.match === "exact") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-success">
        <CheckIcon className="size-3" aria-hidden /> Same product
      </span>
    );
  }
  // Say what actually differs, so "similar" isn't mistaken for the same item.
  const samePack = quantityKey(row.offer.quantity) !== null && quantityKey(row.offer.quantity) === quantityKey(reference.quantity);
  return (
    <span className="text-xs text-warning">{samePack ? "Different product, same pack size" : "Different pack size or variant"}</span>
  );
}

/**
 * Cross-platform prices, cheapest first. "Lowest price" and "+₹X" are only
 * computed across exact matches, so a different pack or flavour never
 * inflates the saving.
 */
export function PriceComparison({ comparison, query, cartKeys }: Props) {
  const { rows, reference, missing } = comparison;
  // Same product first (where "lowest price" is meaningful), then similar items.
  const ordered = [...rows.filter((r) => r.match === "exact"), ...rows.filter((r) => r.match !== "exact")];
  const similarStart = ordered.findIndex((r) => r.match !== "exact");
  const similarLabel = "Similar products, different brand, variant or pack";
  const exact = exactRows(rows);
  const lowest = exact[0]?.offer ?? rows.find((row) => row.offer.available)?.offer;
  const highestExact = exact.length ? Math.max(...exact.map((row) => row.offer.price)) : 0;

  const extraFor = (row: ComparisonRow) =>
    lowest && row.match === "exact" && row.offer.available && row.offer.listingId !== lowest.listingId
      ? row.offer.price - lowest.price
      : 0;

  return (
    <div className="space-y-3">
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Prices for {reference.name} across platforms, cheapest first</caption>
          <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">Platform</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Listing</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Delivery</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Price</th>
              <th scope="col" className="px-4 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ordered.map((row, index) => {
              const { offer } = row;
              const isLowest = offer.listingId === lowest?.listingId;
              const extra = extraFor(row);
              return (
                <Fragment key={offer.listingId}>
                {index === similarStart && (
                  <tr>
                    <th colSpan={5} scope="rowgroup" className="bg-muted/50 px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                      {similarLabel}
                    </th>
                  </tr>
                )}
                <tr
                  className={cn("align-middle", isLowest && "bg-success-subtle/50 shadow-[inset_3px_0_0_var(--success)]")}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <PlatformLogo platform={offer.platform} size="md" />
                      <div>
                        <p className="font-medium">{PLATFORMS[offer.platform].name}</p>
                        {isLowest && <p className="text-xs font-semibold text-success">Lowest price</p>}
                      </div>
                    </div>
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <Link
                      href={productHref(offer.platform, offer.productId, query)}
                      className="line-clamp-1 hover:text-primary hover:underline"
                    >
                      {offer.name}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      {offer.quantity && <span>{offer.quantity}</span>}
                      <MatchLabel row={row} reference={reference} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm">{offer.eta ?? PLATFORMS[offer.platform].typicalEta}</p>
                    <StockStatus available={offer.available} inventory={offer.inventory} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className={cn("price text-lg", !offer.available && "text-muted-foreground")}>
                      {formatPrice(offer.price)}
                    </p>
                    <div className="flex items-center justify-end gap-2 text-xs tabular">
                      {offer.mrp && offer.mrp > offer.price && (
                        <span className="text-muted-foreground line-through">{formatPrice(offer.mrp)}</span>
                      )}
                      <DiscountBadge percent={offer.discountPercent} />
                    </div>
                    {extra > 0 ? (
                      <p className="text-xs text-muted-foreground tabular">+{formatPrice(extra)} vs lowest</p>
                    ) : offer.unitPrice ? (
                      <p className="text-xs text-muted-foreground tabular">
                        {formatPrice(offer.unitPrice.value)}/{offer.unitPrice.per}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <BuyOnPlatformButton platform={offer.platform} href={offer.deeplink} compact size="sm" />
                      <AddToCartButton
                        product={toSnapshot(offer)}
                        inCart={cartKeys.has(offer.key)}
                        disabled={!offer.available}
                        size="sm"
                        variant={isLowest ? "default" : "outline"}
                        label="Add"
                      />
                    </div>
                  </td>
                </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <ul className="divide-y overflow-hidden rounded-lg border bg-card md:hidden">
        {ordered.map((row, index) => {
          const { offer } = row;
          const isLowest = offer.listingId === lowest?.listingId;
          const extra = extraFor(row);
          return (
            <Fragment key={offer.listingId}>
            {index === similarStart && (
              <li className="bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">{similarLabel}</li>
            )}
            <li
              className={cn("p-3", isLowest && "bg-success-subtle/50 shadow-[inset_3px_0_0_var(--success)]")}
            >
              <div className="flex items-start gap-3">
                <PlatformLogo platform={offer.platform} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-medium">{PLATFORMS[offer.platform].shortName}</p>
                    <p className={cn("price text-lg", !offer.available && "text-muted-foreground")}>
                      {formatPrice(offer.price)}
                    </p>
                  </div>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {offer.quantity ?? offer.name}, {offer.eta ?? PLATFORMS[offer.platform].typicalEta}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    {isLowest ? (
                      <span className="text-xs font-semibold text-success">Lowest price</span>
                    ) : (
                      <MatchLabel row={row} reference={reference} />
                    )}
                    {extra > 0 && <span className="text-xs text-muted-foreground tabular">+{formatPrice(extra)}</span>}
                    {!offer.available && <StockStatus available={false} />}
                  </div>
                </div>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2 pl-10">
                <BuyOnPlatformButton platform={offer.platform} href={offer.deeplink} size="sm" />
                <AddToCartButton
                  product={toSnapshot(offer)}
                  inCart={cartKeys.has(offer.key)}
                  disabled={!offer.available}
                  size="sm"
                  variant={isLowest ? "default" : "outline"}
                />
              </div>
            </li>
            </Fragment>
          );
        })}
      </ul>

      {exact.length > 1 && lowest && highestExact > lowest.price && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <InfoIcon className="size-4 shrink-0" aria-hidden />
          The same pack costs up to{" "}
          <strong className="font-semibold text-foreground tabular">{formatPrice(highestExact - lowest.price)}</strong>{" "}
          more on other platforms.
        </p>
      )}

      {missing.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <SearchXIcon className="size-4" aria-hidden />
          Not found near you on
          {missing.map((platform) => (
            <span key={platform} className="inline-flex items-center gap-1 font-medium text-foreground">
              <PlatformLogo platform={platform} size="xs" />
              {PLATFORMS[platform].shortName}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
