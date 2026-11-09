import { MailIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { PLATFORM_LIST } from "@/config/platforms";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Compare prices", href: "/search" },
      { label: "Your cart", href: "/cart" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Account", href: "/account" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "FAQ", href: "/#faq" },
      { label: "Contact us", href: `mailto:${siteConfig.supportEmail}`, external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
];

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("mt-16 border-t bg-card pb-20 md:pb-0", className)}>
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-8" />
            <span className="font-heading font-bold">{siteConfig.name}</span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            India&apos;s price-comparison layer for everyday shopping. One search across quick-commerce apps,
            supermarkets and marketplaces — so you always know where your money goes furthest.
          </p>
          <ul className="flex flex-wrap gap-1.5" aria-label="Platforms compared">
            {PLATFORM_LIST.map((p) => (
              <li key={p.id}>
                <PlatformLogo platform={p.id} size="md" />
              </li>
            ))}
          </ul>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h3 className="mb-3 text-sm font-semibold">{column.title}</h3>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition hover:text-foreground"
                    {...(link.external ? { rel: "noopener noreferrer" } : {})}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t">
        <div className="container-page flex flex-col gap-3 py-5 text-xs text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
          <p className="flex items-center gap-1.5">
            <ShieldCheckIcon className="size-3.5 shrink-0" aria-hidden />
            © {siteConfig.name}. USC never processes payments — every order is placed on the platform you choose.
          </p>
          <p className="flex items-center gap-1.5">
            <MailIcon className="size-3.5 shrink-0" aria-hidden />
            <a href={`mailto:${siteConfig.supportEmail}`} className="hover:text-foreground">
              {siteConfig.supportEmail}
            </a>
            <span aria-hidden>·</span>
            Platform names and logos are trademarks of their respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
