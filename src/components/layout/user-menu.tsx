"use client";

import {
  HeartIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  ShoppingCartIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { signOutAction } from "@/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPhone, initials } from "@/lib/format";

export interface MenuUser {
  name: string | null;
  email: string | null;
  phone: string | null;
}


export function UserMenu({ user }: { user: MenuUser }) {
  const { theme, setTheme } = useTheme();
  const subtitle = user.email ?? (user.phone ? formatPhone(user.phone) : "");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="ml-1 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring"
        aria-label="Account menu"
      >
        <Avatar className="size-8 rounded-md after:rounded-md">
          <AvatarFallback className="rounded-md bg-secondary text-xs font-semibold text-secondary-foreground">
            {initials(user)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold">{user.name ?? "Your account"}</p>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/account">
              <UserIcon /> Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/cart">
              <ShoppingCartIcon /> Cart
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/wishlist">
              <HeartIcon /> Wishlist
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunIcon /> Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">
                <SunIcon /> Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <MoonIcon /> Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <MonitorIcon /> System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full">
              <LogOutIcon /> Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
