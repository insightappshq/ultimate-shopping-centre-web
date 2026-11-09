import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { price: "text-sm", mrp: "text-xs" },
  md: { price: "text-base", mrp: "text-xs" },
  lg: { price: "text-xl", mrp: "text-sm" },
  xl: { price: "text-3xl", mrp: "text-base" },
} as const;

export function Price({
  price,
  mrp,
  size = "md",
  className,
}: {
  price: number;
  mrp?: number | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const showMrp = mrp !== null && mrp !== undefined && mrp > price;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5 tabular", className)}>
      <span className={cn("font-heading font-bold text-foreground", SIZES[size].price)}>
        {formatPrice(price)}
      </span>
      {showMrp && (
        <span className={cn("text-muted-foreground line-through", SIZES[size].mrp)}>
          <span className="sr-only">MRP </span>
          {formatPrice(mrp)}
        </span>
      )}
    </span>
  );
}

export function DiscountBadge({ percent, className }: { percent: number; className?: string }) {
  if (percent < 1) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-success-subtle px-1.5 py-0.5 text-[0.7rem] font-semibold text-success tabular",
        className,
      )}
    >
      {percent}% off
    </span>
  );
}
