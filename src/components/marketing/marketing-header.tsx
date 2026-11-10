import { ArrowRightIcon, MenuIcon } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Platforms", href: "/#platforms" },
  { label: "FAQ", href: "/#faq" },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="container-page flex h-16 items-center gap-6">
        <Logo />
        <nav aria-label="Main" className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Button variant="ghost" size="lg" asChild className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="lg" asChild>
            <Link href="/signup">
              Get started <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-lg" className="md:hidden" aria-label="Open menu">
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
                {NAV.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link href={item.href} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent">
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link href="/login" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent">
                    Sign in
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
