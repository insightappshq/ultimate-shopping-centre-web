import { HeartIcon, ShoppingCartIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/dal";
import { getCartCount } from "@/lib/data/cart";
import { getWishlistCount } from "@/lib/data/wishlist";
import { fallbackTo } from "@/lib/errors";
import { UserMenu } from "./user-menu";

function CountBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-sm bg-primary px-1 text-[0.65rem] font-bold text-primary-foreground ring-2 ring-card tabular">
      {count > 99 ? "99+" : count}
    </span>
  );
}

async function getBadgeCounts(userId: string) {
  // Badges must never take the header down if the database hiccups.
  return Promise.all([getCartCount(userId), getWishlistCount(userId)]).catch(fallbackTo([0, 0] as const));
}

/** Session-dependent header actions. Rendered inside a Suspense boundary. */
export async function HeaderActions() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon-lg" asChild className="hidden md:inline-flex">
          <Link href="/cart" aria-label="Cart">
            <ShoppingCartIcon className="size-5" />
          </Link>
        </Button>
        <Button asChild size="lg">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  const [cartCount, wishlistCount] = await getBadgeCounts(user.id);

  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <Button variant="ghost" size="icon" asChild className="relative hidden md:inline-flex">
        <Link href="/wishlist" aria-label={`Wishlist, ${wishlistCount} items`}>
          <HeartIcon className="size-5" />
          <CountBadge count={wishlistCount} />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" asChild className="relative hidden md:inline-flex">
        <Link href="/cart" aria-label={`Cart, ${cartCount} items`}>
          <ShoppingCartIcon className="size-5" />
          <CountBadge count={cartCount} />
        </Link>
      </Button>
      <UserMenu user={{ name: user.name, email: user.email, phone: user.phone }} />
    </div>
  );
}

export function HeaderActionsFallback() {
  return (
    <div className="flex items-center gap-2">
      <div className="hidden size-9 animate-pulse rounded-lg bg-muted md:block" />
      <div className="size-9 animate-pulse rounded-full bg-muted" />
    </div>
  );
}

/** Cart count for the mobile tab bar. */
export async function MobileCartCount() {
  const user = await getCurrentUser();
  if (!user) return 0;
  return getCartCount(user.id).catch(fallbackTo(0));
}
