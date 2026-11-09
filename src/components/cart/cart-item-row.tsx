"use client";

import { ArrowLeftRightIcon, HeartIcon, Loader2Icon, MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import {
  markCartItemOrderedAction,
  moveCartItemToWishlistAction,
  removeCartItemAction,
  updateCartQuantityAction,
} from "@/actions/cart";
import { BuyOnPlatformButton } from "@/components/product/buy-on-platform-button";
import { DiscountBadge } from "@/components/product/price";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { CartItem } from "@/lib/data/cart";
import { MAX_CART_QUANTITY } from "@/lib/data/schemas";
import { formatPrice } from "@/lib/format";
import { productHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function CartItemRow({ item }: { item: CartItem }) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    { quantity: item.quantity, ordered: item.status === "ORDERED" },
    (state, patch: Partial<{ quantity: number; ordered: boolean }>) => ({ ...state, ...patch }),
  );

  const run = (action: () => Promise<{ ok: boolean; error?: string }>, success?: string) =>
    startTransition(async () => {
      const result = await action();
      if (!result.ok) toast.error(result.error ?? "Something went wrong");
      else if (success) toast.success(success);
    });

  const setQuantity = (quantity: number) =>
    run(async () => {
      setOptimistic({ quantity });
      return updateCartQuantityAction(item.id, quantity);
    });

  const discount = item.mrp && item.mrp > item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;

  return (
    <li className={cn("flex gap-3 py-4 sm:gap-4", optimistic.ordered && "opacity-60")}>
      <Link
        href={productHref(item.platform, item.productId)}
        className="relative size-20 shrink-0 overflow-hidden rounded-xl border bg-white sm:size-24"
      >
        <ProductImage src={item.image} alt={item.name} sizes="96px" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {item.brand && <p className="text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">{item.brand}</p>}
            <Link
              href={productHref(item.platform, item.productId)}
              className={cn("line-clamp-2 text-sm font-medium hover:text-primary", optimistic.ordered && "line-through")}
            >
              {item.name}
            </Link>
            {item.packSize && <p className="text-xs text-muted-foreground">{item.packSize}</p>}
          </div>
          <div className="text-right tabular">
            <p className="font-heading font-bold">{formatPrice(item.price * optimistic.quantity)}</p>
            {optimistic.quantity > 1 && (
              <p className="text-xs text-muted-foreground">{formatPrice(item.price)} each</p>
            )}
            <DiscountBadge percent={discount} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border" role="group" aria-label="Quantity">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Decrease quantity"
              disabled={pending || optimistic.quantity <= 1 || optimistic.ordered}
              onClick={() => setQuantity(optimistic.quantity - 1)}
            >
              <MinusIcon />
            </Button>
            <span className="w-7 text-center text-sm font-semibold tabular" aria-live="polite">
              {optimistic.quantity}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Increase quantity"
              disabled={pending || optimistic.quantity >= MAX_CART_QUANTITY || optimistic.ordered}
              onClick={() => setQuantity(optimistic.quantity + 1)}
            >
              <PlusIcon />
            </Button>
          </div>

          <BuyOnPlatformButton platform={item.platform} href={item.deeplink} size="sm" compact />

          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium hover:bg-muted">
            <Checkbox
              checked={optimistic.ordered}
              disabled={pending}
              onCheckedChange={(checked) =>
                run(async () => {
                  setOptimistic({ ordered: checked === true });
                  return markCartItemOrderedAction(item.id, checked === true);
                })
              }
            />
            Purchased
          </label>

          <div className="ml-auto flex items-center gap-0.5">
            {pending && <Loader2Icon className="size-4 animate-spin text-muted-foreground" aria-label="Updating" />}
            <Button variant="ghost" size="icon-sm" asChild title="Compare prices">
              <Link href={productHref(item.platform, item.productId)} aria-label="Compare prices">
                <ArrowLeftRightIcon />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Move to wishlist"
              aria-label="Move to wishlist"
              disabled={pending}
              onClick={() => run(() => moveCartItemToWishlistAction(item.id), "Moved to wishlist")}
            >
              <HeartIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Remove"
              aria-label="Remove from cart"
              disabled={pending}
              onClick={() => run(() => removeCartItemAction(item.id), "Removed from cart")}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2Icon />
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
