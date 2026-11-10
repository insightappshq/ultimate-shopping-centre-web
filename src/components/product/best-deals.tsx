import { BadgePercentIcon, CrownIcon, ScaleIcon, ZapIcon, type LucideIcon } from "lucide-react";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { PLATFORMS } from "@/config/platforms";
import { formatPrice } from "@/lib/format";
import { exactRows } from "@/lib/quickcommerce/matching";
import type { Comparison, Offer } from "@/lib/quickcommerce/types";
import { cn } from "@/lib/utils";

interface Deal {
  key: string;
  icon: LucideIcon;
  title: string;
  offer: Offer;
  detail: string;
  tone: string;
}

/** Picks the stand-out options: cheapest, fastest, best value and biggest discount. */
export function pickDeals(comparison: Comparison): Deal[] {
  const offers = comparison.rows.map((r) => r.offer).filter((o) => o.available);
  if (!offers.length) return [];

  // Every claim compares like for like: exact matches only (same product and pack).
  const exact = exactRows(comparison.rows).map((r) => r.offer);
  const pool = exact.length ? exact : offers;
  const cheapest = pool.reduce((a, b) => (b.price < a.price ? b : a));
  const highest = Math.max(...pool.map((o) => o.price));
  const deals: Deal[] = [
    {
      key: "cheapest",
      icon: CrownIcon,
      title: "Lowest price",
      offer: cheapest,
      detail: highest > cheapest.price ? `${formatPrice(highest - cheapest.price)} less than the highest` : "Best available price",
      tone: "text-success",
    },
  ];

  const timed = pool.filter((o) => o.etaMinutes !== null);
  if (timed.length > 1) {
    const fastest = timed.reduce((a, b) => (b.etaMinutes! < a.etaMinutes! ? b : a));
    deals.push({
      key: "fastest",
      icon: ZapIcon,
      title: "Fastest delivery",
      offer: fastest,
      detail: `Arrives in ${fastest.eta}`,
      tone: "text-primary",
    });
  }

  const unitPriced = pool.filter((o) => o.unitPrice);
  if (unitPriced.length > 1) {
    const value = unitPriced.reduce((a, b) => (b.unitPrice!.value < a.unitPrice!.value ? b : a));
    if (value.listingId !== cheapest.listingId) {
      deals.push({
        key: "value",
        icon: ScaleIcon,
        title: "Best value",
        offer: value,
        detail: `${formatPrice(value.unitPrice!.value)} per ${value.unitPrice!.per}`,
        tone: "text-foreground",
      });
    }
  }

  const discounted = pool.reduce((a, b) => (b.discountPercent > a.discountPercent ? b : a));
  if (discounted.discountPercent >= 5 && discounted.listingId !== cheapest.listingId) {
    deals.push({
      key: "discount",
      icon: BadgePercentIcon,
      title: "Biggest discount",
      offer: discounted,
      detail: `${discounted.discountPercent}% off MRP`,
      tone: "text-deal",
    });
  }

  return deals;
}

export function BestDeals({ comparison, className }: { comparison: Comparison; className?: string }) {
  const deals = pickDeals(comparison);
  // A single deal just repeats the comparison table's "Lowest price" row.
  if (deals.length < 2) return null;

  return (
    <ul
      className={cn("grid divide-y rounded-lg border bg-card sm:grid-cols-2 sm:divide-y-0 [&>li:nth-child(n+3)]:sm:border-t [&>li:nth-child(even)]:sm:border-l", className)}
      aria-label="Best deals"
    >
      {deals.map((deal) => (
        <li key={deal.key} className="flex items-center gap-3 p-3">
          <deal.icon className={cn("size-4 shrink-0", deal.tone)} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{deal.title}</p>
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <PlatformLogo platform={deal.offer.platform} size="xs" />
              <span className="truncate">{PLATFORMS[deal.offer.platform].shortName}</span>
              <span className="price ml-auto text-base">{formatPrice(deal.offer.price)}</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">{deal.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
