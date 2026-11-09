"use client";

import { HeartIcon, HomeIcon, SearchIcon, ShoppingCartIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: HomeIcon, match: (p: string) => p === "/" },
  { href: "/search", label: "Search", icon: SearchIcon, match: (p: string) => p.startsWith("/search") || p.startsWith("/product") },
  { href: "/wishlist", label: "Wishlist", icon: HeartIcon, match: (p: string) => p.startsWith("/wishlist") },
  { href: "/cart", label: "Cart", icon: ShoppingCartIcon, match: (p: string) => p.startsWith("/cart") },
  { href: "/account", label: "Account", icon: UserIcon, match: (p: string) => p.startsWith("/account") },
] as const;

export function MobileTabBar({ cartCount = 0 }: { cartCount?: number }) {
  return <MobileTabBarView cartCount={cartCount} pathname={usePathname()} />;
}

/** Hook-free view so it can also render as a static fallback (no active tab). */
export function MobileTabBarView({ cartCount = 0, pathname }: { cartCount?: number; pathname?: string }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = pathname !== undefined && match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-2 text-[0.68rem] font-medium text-muted-foreground transition",
                  active && "text-primary",
                )}
              >
                <span className="relative">
                  <Icon className={cn("size-5", active && "stroke-[2.4]")} aria-hidden />
                  {href === "/cart" && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-deal px-1 text-[0.6rem] font-bold text-deal-foreground">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
