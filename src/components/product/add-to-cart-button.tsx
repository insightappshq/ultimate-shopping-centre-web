"use client";

import { CheckIcon, Loader2Icon, ShoppingCartIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addToCartAction } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import { PLATFORMS } from "@/config/platforms";
import type { ProductSnapshot } from "@/lib/data/schemas";
import { useAuthRedirect } from "./use-auth-redirect";

export function AddToCartButton({
  product,
  inCart = false,
  label = "Add to cart",
  ...buttonProps
}: {
  product: ProductSnapshot;
  inCart?: boolean;
  label?: string;
} & Omit<React.ComponentProps<typeof Button>, "onClick" | "children">) {
  const router = useRouter();
  const redirectToLogin = useAuthRedirect();
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    startTransition(async () => {
      const result = await addToCartAction(product);
      if (!result.ok) {
        if (result.code === "unauthorized") return redirectToLogin("Sign in to add items to your cart");
        toast.error(result.error);
        return;
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
      toast.success(`Added to cart`, {
        description: `${product.name} · ${PLATFORMS[product.platform].name}`,
        action: { label: "View cart", onClick: () => router.push("/cart") },
      });
    });
  };

  const showAdded = added || (inCart && !pending);

  return (
    <Button
      {...buttonProps}
      onClick={handleClick}
      disabled={pending || buttonProps.disabled}
      aria-live="polite"
    >
      {pending ? (
        <Loader2Icon className="animate-spin" data-icon="inline-start" />
      ) : showAdded ? (
        <CheckIcon data-icon="inline-start" />
      ) : (
        <ShoppingCartIcon data-icon="inline-start" />
      )}
      {added ? "Added" : inCart ? "Add another" : label}
    </Button>
  );
}
