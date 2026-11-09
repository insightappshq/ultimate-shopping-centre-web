import { BadgePercentIcon, CrownIcon, ScaleIcon, ZapIcon, type LucideIcon } from "lucide-react";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { PLATFORMS } from "@/config/platforms";
import { formatPrice } from "@/lib/format";
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

  const cheapest = offers.reduce((a, b) => (b.price < a.price ? b : a));
  const highest = Math.max(...offers.map((o) => o.price));
  const deals: Deal[] = [
    {
      key: "cheapest",
      icon: CrownIcon,
      title: "Lowest price",
      offer: cheapest,
      detail: highest > cheapest.price ? `Save ${formatPrice(highest - cheapest.price)} vs. highest` : "Best available price",
      tone: "bg-success-subtle text-success",
    },
  ];

  const timed = offers.filter((o) => o.etaMinutes !== null);
  if (timed.length > 1) {
    const fastest = timed.reduce((a, b) => (b.etaMinutes! < a.etaMinutes! ? b : a));
    deals.push({
      key: "fastest",
      icon: ZapIcon,
      title: "Fastest delivery",
      offer: fastest,
      detail: `${fastest.eta} · ${formatPrice(fastest.price)}`,
      tone: "bg-secondary text-primary",
    });
  }

  const unitPriced = offers.filter((o) => o.unitPrice);
  if (unitPriced.length > 1) {
    const value = unitPriced.reduce((a, b) => (b.unitPrice!.value < a.unitPrice!.value ? b : a));
    if (value.key !== cheapest.key) {
      deals.push({
        key: "value",
        icon: ScaleIcon,
        title: "Best value",
        offer: value,
        detail: `${formatPrice(value.unitPrice!.value)} per ${value.unitPrice!.per}`,
        tone: "bg-accent text-accent-foreground",
      });
    }
  }

  const discounted = offers.reduce((a, b) => (b.discountPercent > a.discountPercent ? b : a));
  if (discounted.discountPercent >= 5 && discounted.key !== cheapest.key) {
    deals.push({
      key: "discount",
      icon: BadgePercentIcon,
      title: "Biggest discount",
      offer: discounted,
      detail: `${discounted.discountPercent}% off MRP`,
      tone: "bg-deal-subtle text-deal-foreground",
    });
  }

  return deals;
}

export function BestDeals({ comparison, className }: { comparison: Comparison; className?: string }) {
  const deals = pickDeals(comparison);
  if (!deals.length) return null;

  return (
    <ul className={cn("grid gap-3 sm:grid-cols-2", className)} aria-label="Best deals">
      {deals.map((deal) => (
        <li key={deal.key} className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-card">
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", deal.tone)}>
            <deal.icon className="size-4.5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">{deal.title}</p>
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <PlatformLogo platform={deal.offer.platform} size="xs" />
              {PLATFORMS[deal.offer.platform].shortName}
              <span className="font-heading tabular">· {formatPrice(deal.offer.price)}</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">{deal.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
