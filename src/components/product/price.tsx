import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { price: "text-[0.95rem]", mrp: "text-xs" },
  md: { price: "text-xl", mrp: "text-xs" },
  lg: { price: "text-2xl", mrp: "text-sm" },
  xl: { price: "text-[2.5rem] leading-none", mrp: "text-base" },
} as const;

/** Shelf-tag price: condensed tabular numerals, MRP struck through beside it. */
export function Price({
  price,
  mrp,
  size = "md",
  muted = false,
  className,
}: {
  price: number;
  mrp?: number | null;
  size?: keyof typeof SIZES;
  muted?: boolean;
  className?: string;
}) {
  const showMrp = mrp !== null && mrp !== undefined && mrp > price;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5", className)}>
      <span className={cn("price", muted ? "text-muted-foreground" : "text-foreground", SIZES[size].price)}>
        {formatPrice(price)}
      </span>
      {showMrp && (
        <span className={cn("text-muted-foreground tabular line-through decoration-1", SIZES[size].mrp)}>
          <span className="sr-only">MRP </span>
          {formatPrice(mrp)}
        </span>
      )}
    </span>
  );
}

/** Percentage off MRP, as plain green text — a fact, not a sticker. */
export function DiscountBadge({ percent, className }: { percent: number; className?: string }) {
  if (percent < 1) return null;
  return <span className={cn("text-xs font-semibold text-success tabular", className)}>{percent}% off</span>;
}
