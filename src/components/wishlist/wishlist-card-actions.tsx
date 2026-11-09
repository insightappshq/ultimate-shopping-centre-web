"use client";

import { Loader2Icon, ShoppingCartIcon, Trash2Icon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { moveWishlistItemToCartAction, removeWishlistItemAction } from "@/actions/wishlist";
import { Button } from "@/components/ui/button";

export function WishlistCardActions({ itemId }: { itemId: string }) {
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(success);
      else toast.error(result.error ?? "Something went wrong");
    });

  return (
    <div className="relative z-10 flex gap-2">
      <Button
        className="flex-1"
        disabled={pending}
        onClick={() => run(() => moveWishlistItemToCartAction(itemId), "Moved to cart")}
      >
        {pending ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <ShoppingCartIcon data-icon="inline-start" />}
        Move to cart
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Remove from wishlist"
        disabled={pending}
        onClick={() => run(() => removeWishlistItemAction(itemId), "Removed from wishlist")}
      >
        <Trash2Icon />
      </Button>
    </div>
  );
}
