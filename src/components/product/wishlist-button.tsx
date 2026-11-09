"use client";

import { HeartIcon } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { toggleWishlistAction } from "@/actions/wishlist";
import { Button } from "@/components/ui/button";
import type { ProductSnapshot } from "@/lib/data/schemas";
import { cn } from "@/lib/utils";
import { useAuthRedirect } from "./use-auth-redirect";

export function WishlistButton({
  product,
  saved = false,
  variant = "icon",
  className,
}: {
  product: ProductSnapshot;
  saved?: boolean;
  variant?: "icon" | "full";
  className?: string;
}) {
  const redirectToLogin = useAuthRedirect();
  const [, startTransition] = useTransition();
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);

  const toggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const next = !optimisticSaved;
    startTransition(async () => {
      setOptimisticSaved(next);
      const result = await toggleWishlistAction(product, next);
      if (!result.ok) {
        if (result.code === "unauthorized") return redirectToLogin("Sign in to save items to your wishlist");
        toast.error(result.error);
        return;
      }
      toast.success(next ? "Saved to wishlist" : "Removed from wishlist");
    });
  };

  const label = optimisticSaved ? "Remove from wishlist" : "Save to wishlist";

  if (variant === "full") {
    return (
      <Button variant="outline" size="xl" onClick={toggle} aria-pressed={optimisticSaved} className={className}>
        <HeartIcon
          data-icon="inline-start"
          className={cn(optimisticSaved && "fill-destructive text-destructive")}
        />
        {optimisticSaved ? "Saved" : "Wishlist"}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={toggle}
      aria-pressed={optimisticSaved}
      aria-label={label}
      title={label}
      className={cn("rounded-full bg-card/90 backdrop-blur", className)}
    >
      <HeartIcon className={cn("size-4", optimisticSaved && "fill-destructive text-destructive")} />
    </Button>
  );
}
