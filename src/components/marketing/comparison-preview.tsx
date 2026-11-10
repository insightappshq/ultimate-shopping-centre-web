import { BadgeCheckIcon, ClockIcon, CrownIcon, MilkIcon, ZapIcon } from "lucide-react";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { PLATFORMS, type PlatformId } from "@/config/platforms";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Static, illustrative rows — clearly labelled as an example in the UI. */
const ROWS: { platform: PlatformId; price: number; eta: string }[] = [
  { platform: "dmart", price: 262, eta: "Next day" },
  { platform: "jiomart", price: 271, eta: "Same day" },
  { platform: "zepto", price: 279, eta: "11 mins" },
  { platform: "blinkit", price: 285, eta: "8 mins" },
];

export function ComparisonPreview({ className }: { className?: string }) {
  const best = ROWS[0];
  return (
    <div className={cn("relative", className)} aria-label="Example of a USC price comparison">
      <div className="relative rounded-lg border bg-card p-5 shadow-elevated sm:p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Example comparison
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ClockIcon className="size-3.5" aria-hidden /> Pincode 400013
          </span>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-md bg-secondary text-primary">
            <MilkIcon className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <p className="font-semibold">Amul Pasteurised Butter</p>
            <p className="text-xs text-muted-foreground">500 g · matched on {ROWS.length} platforms</p>
          </div>
        </div>

        <ul className="mt-4 space-y-2">
          {ROWS.map((row) => {
            const isBest = row.platform === best.platform;
            return (
              <li
                key={row.platform}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-2.5",
                  isBest ? "border-success/40 bg-success-subtle/70" : "bg-background",
                )}
              >
                <PlatformLogo platform={row.platform} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{PLATFORMS[row.platform].name}</p>
                  <p className="text-xs text-muted-foreground">{row.eta}</p>
                </div>
                {isBest && (
                  <span className="hidden items-center gap-1 rounded-md bg-success px-1.5 py-0.5 text-[0.68rem] font-semibold text-success-foreground sm:inline-flex">
                    <CrownIcon className="size-3" aria-hidden /> Best price
                  </span>
                )}
                <span className="price">{formatPrice(row.price)}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <p className="flex items-center gap-1.5 rounded-lg bg-muted/70 px-2.5 py-2">
            <BadgeCheckIcon className="size-3.5 text-success" aria-hidden />
            Save {formatPrice(ROWS[ROWS.length - 1].price - best.price)} on one item
          </p>
          <p className="flex items-center gap-1.5 rounded-lg bg-muted/70 px-2.5 py-2">
            <ZapIcon className="size-3.5 text-primary" aria-hidden />
            Fastest: Blinkit, 8 mins
          </p>
        </div>
      </div>
    </div>
  );
}
