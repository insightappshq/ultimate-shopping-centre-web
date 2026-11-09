import { ClockIcon, StarIcon } from "lucide-react";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Rating({
  rating,
  count,
  className,
}: {
  rating: number | null;
  count?: number | null;
  className?: string;
}) {
  if (!rating) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground tabular", className)}>
      <span className="inline-flex items-center gap-0.5 rounded bg-success px-1 py-px text-[0.68rem] font-semibold text-success-foreground">
        {rating.toFixed(1)}
        <StarIcon className="size-2.5 fill-current" aria-hidden />
      </span>
      {count ? <span>({formatCount(count)})</span> : null}
      <span className="sr-only">out of 5 stars</span>
    </span>
  );
}

export function Eta({ eta, className }: { eta: string | null; className?: string }) {
  if (!eta) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
      <ClockIcon className="size-3" aria-hidden />
      {eta}
    </span>
  );
}

export function StockStatus({
  available,
  inventory,
  className,
}: {
  available: boolean;
  inventory?: number | null;
  className?: string;
}) {
  if (!available) {
    return <span className={cn("text-xs font-medium text-destructive", className)}>Out of stock</span>;
  }
  if (inventory !== null && inventory !== undefined && inventory > 0 && inventory <= 5) {
    return <span className={cn("text-xs font-medium text-warning", className)}>Only {inventory} left</span>;
  }
  return <span className={cn("text-xs font-medium text-success", className)}>In stock</span>;
}
